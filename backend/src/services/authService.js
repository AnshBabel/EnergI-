import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

// Register a new ADMIN + create their Organization
export const registerAdmin = async ({ name, email, password, orgName, orgSlug, contactEmail }) => {
  // Check org slug uniqueness
  const existingOrg = await Organization.findOne({ slug: orgSlug });
  if (existingOrg) throw Object.assign(new Error('Organization slug already taken'), { status: 409 });

  // Create org
  const org = await Organization.create({ name: orgName, slug: orgSlug, contactEmail });

  // Check email uniqueness within org (shouldn't conflict but guard anyway)
  const existingUser = await User.findOne({ organizationId: org._id, email });
  if (existingUser) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    organizationId: org._id,
    name,
    email,
    passwordHash,
    role: 'ADMIN',
  });

  const tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
  return { user, org, tokens };
};

// Register a CONSUMER under an existing org (called by ADMIN)
export const registerConsumer = async ({ name, email, password, organizationId, meterNumber, address, phone }) => {
  const existingUser = await User.findOne({ organizationId, email });
  if (existingUser) throw Object.assign(new Error('Email already in use in this organization'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    organizationId,
    name,
    email,
    passwordHash,
    role: 'CONSUMER',
    meterNumber,
    address,
    phone,
  });

  return user;
};

export const login = async ({ email, password, orgSlug }) => {
  // Find org by slug
  const org = await Organization.findOne({ slug: orgSlug, isActive: true });
  if (!org) throw Object.assign(new Error('Organization not found'), { status: 404 });

  const user = await User.findOne({ organizationId: org._id, email, isActive: true });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
  return { user, org, tokens };
};

export const refreshAccessToken = (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const { accessToken } = generateTokens(payload.userId, payload.organizationId, payload.role);
  return accessToken;
};
