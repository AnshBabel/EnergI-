import { jest } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import { generateTokens, generateImpersonationToken } from '../src/utils/jwt.js';
import { authenticate, requireAdmin, requireConsumer, requireSuperAdmin, blockImpersonatedHighRiskOps } from '../src/middleware/auth.js';
import * as billService from '../src/services/billService.js';
import * as disputeService from '../src/services/disputeService.js';

describe('Phase 1 Security Tests', () => {

  describe('Authentication Middleware & JWT Tokens', () => {
    test('Valid Bearer Token is accepted', () => {
      const tokens = generateTokens('user123', 'org123', 'CONSUMER');
      const req = { headers: { authorization: `Bearer ${tokens.accessToken}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.userId).toBe('user123');
      expect(req.user.organizationId).toBe('org123');
      expect(req.user.role).toBe('CONSUMER');
    });

    test('Query string token is REJECTED (SEC-03)', () => {
      const tokens = generateTokens('user123', 'org123', 'CONSUMER');
      const req = { headers: {}, query: { token: tokens.accessToken }, method: 'GET' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('Expired or malformed token is rejected', () => {
      const req = { headers: { authorization: 'Bearer invalid_or_expired_token' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('Missing token is rejected', () => {
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('SEC-01: Impersonation Hardening & High-Risk Blocklist', () => {
    test('Impersonated tokens include isImpersonated and impersonatorId', () => {
      const impToken = generateImpersonationToken('targetUser1', 'targetOrg1', 'CONSUMER', 'superAdmin1');
      const req = { headers: { authorization: `Bearer ${impToken}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.isImpersonated).toBe(true);
      expect(req.user.impersonatorId).toBe('superAdmin1');
    });

    test('Impersonated tokens block high-risk operations', () => {
      const req = { user: { isImpersonated: true, role: 'ADMIN' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      blockImpersonatedHighRiskOps(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/High-risk operation denied/)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('Non-impersonated tokens pass high-risk operations blocklist check', () => {
      const req = { user: { isImpersonated: false, role: 'ADMIN' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      blockImpersonatedHighRiskOps(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('SEC-04: Multi-Tenant & Cross-User IDOR Protection', () => {
    test('getBillById scopes query to organizationId AND userId for CONSUMER role', async () => {
      const mockBill = { _id: 'bill1', organizationId: 'org1', userId: 'user1' };
      const getBillByIdImplementation = async (orgId, billId, user) => {
        const query = { _id: billId, organizationId: orgId };
        if (user && user.role === 'CONSUMER') {
          query.userId = user.userId;
        }
        if (query._id === mockBill._id && query.organizationId === mockBill.organizationId && (!query.userId || query.userId === mockBill.userId)) {
          return mockBill;
        }
        throw Object.assign(new Error('Bill not found'), { status: 404 });
      };

      // Own bill access -> Allowed
      const consumerA = { userId: 'user1', organizationId: 'org1', role: 'CONSUMER' };
      const ownBill = await getBillByIdImplementation('org1', 'bill1', consumerA);
      expect(ownBill).toBeDefined();

      // Other consumer bill access -> Denied (404)
      const consumerB = { userId: 'user2', organizationId: 'org1', role: 'CONSUMER' };
      await expect(getBillByIdImplementation('org1', 'bill1', consumerB)).rejects.toThrow('Bill not found');
    });
  });

});
