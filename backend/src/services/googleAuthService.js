import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { env } from '../config/env.js';
import * as authService from './authService.js';
import { logger } from '../utils/logger.js';

/**
 * Validates Google ID token using Google API TokenInfo endpoint.
 * In a test environment, allows mock fallback values.
 */
export const verifyGoogleIdToken = async (idToken) => {
  if (env.NODE_ENV === 'test' && idToken.startsWith('mock_token_')) {
    // Return mock values for automated tests
    const parts = idToken.split('_');
    return {
      sub: parts[2] || 'mock_sub_123',
      email: parts[3] || 'mock_user@example.com',
      email_verified: 'true',
      aud: env.GOOGLE_CLIENT_ID,
      iss: 'accounts.google.com',
      name: parts[4] || 'Google User'
    };
  }

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new Error('Google token validation request failed');
    }

    const payload = await response.json();

    // 1. Verify Audience
    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new Error('Audience mismatch: The token was not issued for this application');
    }

    // 2. Verify Issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw new Error('Issuer mismatch: The token issuer is unrecognized');
    }

    // 3. Verify Email Verification Status
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      throw new Error('Google account email is not verified');
    }

    // 4. Verify Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && parseInt(payload.exp) < now) {
      throw new Error('Google token has expired');
    }

    return payload;
  } catch (err) {
    logger.warn('[Google Auth] OIDC validation failed', { error: err.message });
    throw Object.assign(new Error(`OIDC validation failed: ${err.message}`), { status: 401 });
  }
};

/**
 * Validates Google Identity and maps it to an EnergI session.
 * Link users by email or create a CONSUMER if allowed.
 */
export const authenticateWithGoogle = async (idToken, orgSlug = null) => {
  const payload = await verifyGoogleIdToken(idToken);
  const { sub, email, name } = payload;

  let user = await User.findOne({ googleId: sub });
  let org = null;

  if (!user) {
    // Attempt secure account linking via email match
    user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      user.googleId = sub;
      user.authProvider = 'GOOGLE';
      await user.save();
      logger.info(`[Google Auth] Linked existing account: ${email} to googleId: ${sub}`);
    } else {
      // Auto-register new CONSUMER user if orgSlug is provided
      if (!orgSlug) {
        throw Object.assign(new Error('User account not found. Organization Slug required to register new consumer.'), { status: 400 });
      }

      org = await Organization.findOne({ slug: orgSlug, isActive: true });
      if (!org) {
        throw Object.assign(new Error('Invalid or inactive organization slug provided.'), { status: 400 });
      }

      user = await User.create({
        organizationId: org._id,
        name: name || 'Google User',
        email: email.toLowerCase().trim(),
        googleId: sub,
        authProvider: 'GOOGLE',
        role: 'CONSUMER',
      });
      logger.info(`[Google Auth] Created new consumer account: ${email} under org: ${org.name}`);
    }
  }

  // Enforce Status Checks
  if (user && !user.isActive) {
    throw Object.assign(new Error('Authentication failed: Account has been deactivated or suspended.'), { status: 403 });
  }

  if (!org) {
    org = await Organization.findById(user.organizationId);
  }

  if (!org || !org.isActive) {
    throw Object.assign(new Error('Authentication failed: Associated organization is inactive.'), { status: 403 });
  }

  // Issue standard JWT session tokens
  const tokens = await authService.issueTokenPair(user._id.toString(), org._id.toString(), user.role);

  return { user, org, tokens };
};
export { authService };
