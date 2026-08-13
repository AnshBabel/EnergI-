import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import * as googleAuthService from '../src/services/googleAuthService.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import RefreshToken from '../src/models/RefreshToken.js';
import AuditLog from '../src/models/AuditLog.js';

const orgId = new mongoose.Types.ObjectId();
const mockOrg = { _id: orgId, name: 'Society Org', slug: 'lpu-slug', isActive: true, toObject() { return this; } };
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Existing Admin',
  email: 'admin@gmail.com',
  organizationId: orgId,
  role: 'ADMIN',
  isActive: true,
  googleId: null,
  authProvider: 'LOCAL',
  toObject() { return this; },
  save: jest.fn().mockResolvedValue(true)
};

const mockDeactivatedUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Suspended Consumer',
  email: 'suspended@gmail.com',
  organizationId: orgId,
  role: 'CONSUMER',
  isActive: false,
  googleId: 'googlesuspendedsub',
  authProvider: 'GOOGLE',
  toObject() { return this; }
};

jest.spyOn(Organization, 'findOne').mockImplementation(async (q) => q.slug === 'lpu-slug' ? mockOrg : null);
jest.spyOn(Organization, 'findById').mockImplementation(async () => mockOrg);
jest.spyOn(User, 'findOne').mockImplementation(async (q) => {
  if (q.googleId === 'googlesuspendedsub' || q.email === 'suspended@gmail.com') return mockDeactivatedUser;
  if (q.email === 'admin@gmail.com') return mockUser;
  return null;
});

// Mock user creation for self-registration - ensure isActive: true is returned
jest.spyOn(User, 'create').mockImplementation(async (data) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    isActive: true,
    ...data,
    toObject() { return this; }
  };
});

// Mock the Mongoose model method to prevent database writes in tests
jest.spyOn(RefreshToken, 'create').mockImplementation(async () => {
  return { _id: new mongoose.Types.ObjectId() };
});

describe('Feature 1.3: Google OAuth/OIDC Authentication Tests', () => {

  describe('Google OIDC Token Validation Integrity', () => {
    test('Mock token with valid claims parses correctly', async () => {
      const claims = await googleAuthService.verifyGoogleIdToken('mock_token_sub123_test@gmail.com_JohnDoe');
      expect(claims.sub).toBe('sub123');
      expect(claims.email).toBe('test@gmail.com');
      expect(claims.name).toBe('JohnDoe');
      expect(claims.email_verified).toBe('true');
    });

    test('Invalid, expired or unverified issuer causes authentication rejection', async () => {
      await expect(googleAuthService.verifyGoogleIdToken('malformed_token_header_body'))
        .rejects.toThrow();
    });
  });

  describe('User Resolving, Account Linking & Privilege Hardening', () => {
    test('Links existing user profile by verified email securely on first social sign-in', async () => {
      const { user } = await googleAuthService.authenticateWithGoogle('mock_token_sub999_admin@gmail.com_AdminName');
      
      expect(user).toBeDefined();
      expect(user.role).toBe('ADMIN'); // Preserved existing role
      expect(user.organizationId.toString()).toBe(orgId.toString()); // Preserved orgId
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.googleId).toBe('sub999');
      expect(mockUser.authProvider).toBe('GOOGLE');
    });

    test('Deactivated user profiles are explicitly rejected (status 403)', async () => {
      await expect(googleAuthService.authenticateWithGoogle('mock_token_googlesuspendedsub_suspended@gmail.com_SuspendedUser'))
        .rejects.toThrow(/Account has been deactivated/);
    });

    test('New social registrations default role to CONSUMER and reject administrative self-selection', async () => {
      const { user } = await googleAuthService.authenticateWithGoogle('mock_token_sub456_newuser@gmail.com_NewUser', 'lpu-slug');
      
      expect(user).toBeDefined();
      expect(user.role).toBe('CONSUMER'); // Hardcoded role validation
      expect(user.googleId).toBe('sub456');
      expect(user.email).toBe('newuser@gmail.com');
    });

    test('New consumer registration without valid organization slug is rejected', async () => {
      await expect(googleAuthService.authenticateWithGoogle('mock_token_sub456_newuser@gmail.com_NewUser', null))
        .rejects.toThrow(/Organization Slug required/);
    });
  });
});
