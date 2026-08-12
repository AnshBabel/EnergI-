import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

export const registerAdmin = async ({ 
  name, 
  email, 
  password, 
  orgName, 
  orgSlug, 
  contactEmail,
  logo,         
  signature,    
  footerText    
}) => {
  // 1. PERMANENT FIX: Pre-validation check 
  // Prevents Mongoose from hitting "Path name is required" by catching it here first
  if (!name || !email || !password || !orgSlug) {
    throw Object.assign(new Error('Missing core registration credentials'), { status: 400 });
  }

  // 2. Check org slug uniqueness
  const existingOrg = await Organization.findOne({ slug: orgSlug });
  if (existingOrg) throw Object.assign(new Error('Organization slug already taken'), { status: 409 });

  // 3. Map file paths
  const logoUrl = logo ? `/uploads/branding/${logo.filename}` : null;
  const signatureUrl = signature ? `/uploads/signatures/${signature.filename}` : null;

  // 4. Create Organization
  const org = await Organization.create({ 
    name: orgName, 
    slug: orgSlug, 
    contactEmail: contactEmail || email,
    logoUrl,
    signatureUrl,
    footerText: footerText || "Thank you for using our services."
  });

  try {
    // 5. Check email uniqueness within the NEW org
    const existingUser = await User.findOne({ organizationId: org._id, email });
    if (existingUser) {
      // Clean up the created org if user creation is impossible
      await Organization.findByIdAndDelete(org._id);
      throw Object.assign(new Error('Email already in use'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // 6. Create the Admin user
    const user = await User.create({
      organizationId: org._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'ADMIN',
    });

    const tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
    return { user, org, tokens };

  } catch (error) {
    // 7. PERMANENT FIX: Cleanup on failure
    // If user creation fails for ANY reason, delete the orphaned organization 
    // to prevent the "Stuck Dashboard" issue caused by incomplete data.
    if (org && org._id) await Organization.findByIdAndDelete(org._id);
    throw error;
  }
};

// Logic for Consumer, Login, and Refresh remain unchanged but benefit from cleaner error bubbling
export const registerConsumer = async ({ 
  name, 
  email, 
  password, 
  organizationId, 
  meterNumber, 
  address, 
  phone,
  isSmartMeterEnabled,
  consumptionRate
}) => {
  const existingUser = await User.findOne({ organizationId, email });
  if (existingUser) throw Object.assign(new Error('Email already in use in this organization'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return await User.create({
    organizationId,
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'CONSUMER',
    meterNumber,
    address,
    phone,
    isSmartMeterEnabled,
    consumptionRate
  });
};

import crypto from 'crypto';
import { nanoid } from 'nanoid';
import RefreshToken from '../models/RefreshToken.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const issueTokenPair = async (userId, organizationId, role, existingFamilyId = null) => {
  const familyId = existingFamilyId || nanoid();
  const tokens = generateTokens(userId, organizationId, role, familyId);
  const tokenHash = hashToken(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    userId,
    familyId,
    tokenHash,
    expiresAt,
  });

  return { ...tokens, familyId };
};

export const login = async ({ email, password, orgSlug }) => {
  const org = await Organization.findOne({ slug: orgSlug, isActive: true });
  if (!org) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const user = await User.findOne({ organizationId: org._id, email: email.toLowerCase().trim(), isActive: true });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const tokens = await issueTokenPair(user._id.toString(), org._id.toString(), user.role);
  return { user, org, tokens };
};

export const loginSuperAdmin = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'SUPER_ADMIN' });
  if (!user) throw Object.assign(new Error('Invalid Super Admin credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid Super Admin credentials'), { status: 401 });

  const org = await Organization.findById(user.organizationId);
  const tokens = await issueTokenPair(user._id.toString(), org._id.toString(), user.role);
  return { user, org, tokens };
};

export const rotateRefreshToken = async (rawRefreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenRecord = await RefreshToken.findOne({ tokenHash });

  if (!tokenRecord) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  // REUSE DETECTION: If used or revoked token presented, revoke whole family
  if (tokenRecord.isUsed || tokenRecord.isRevoked) {
    await RefreshToken.updateMany({ familyId: tokenRecord.familyId }, { isRevoked: true });
    throw Object.assign(new Error('Refresh token reuse detected. Family revoked.'), { status: 401 });
  }

  // ATOMIC ROTATION: Mark old token used
  tokenRecord.isUsed = true;
  await tokenRecord.save();

  // Issue new token pair under same family
  const newTokens = await issueTokenPair(payload.userId, payload.organizationId, payload.role, tokenRecord.familyId);
  return newTokens;
};

export const revokeUserTokens = async (userId) => {
  await RefreshToken.updateMany({ userId }, { isRevoked: true });
};