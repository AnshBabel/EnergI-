import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import AuditLog from '../src/models/AuditLog.js';
import * as auditLogService from '../src/services/auditLogService.js';
import { correlationMiddleware } from '../src/middleware/correlation.js';
import { authenticate } from '../src/middleware/auth.js';
import { generateTokens } from '../src/utils/jwt.js';

// Setup Mock for Mongoose Model
jest.spyOn(AuditLog, 'create').mockImplementation(async (data) => {
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    ...data,
    timestamp: new Date(),
    toObject() { return this; }
  };
  return doc;
});

describe('Feature 1.1: Immutable Audit Logs Tests', () => {

  describe('Sensitive Field Protection & Sanitization', () => {
    test('Redacts password, JWT, secrets, and Stripe tokens recursively', () => {
      const sensitiveData = {
        name: 'John Doe',
        password: 'cleartextpassword123',
        nested: {
          secret: 'super-sensitive-api-token',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          safeField: 'all-good-here'
        }
      };

      const clean = auditLogService.sanitizeSensitiveData(sensitiveData);
      
      expect(clean.password).toBe('[REDACTED]');
      expect(clean.nested.secret).toBe('[REDACTED]');
      expect(clean.nested.jwt).toBe('[REDACTED]');
      expect(clean.nested.safeField).toBe('all-good-here');
      expect(clean.name).toBe('John Doe');
    });
  });

  describe('Mongoose Immutability Enforcement', () => {
    test('Instance saving on existing record throws mutation error', async () => {
      const mockDoc = new AuditLog({
        organizationId: new mongoose.Types.ObjectId(),
        actorId: new mongoose.Types.ObjectId(),
        actorRole: 'ADMIN',
        action: 'TARIFF_CREATED'
      });

      // Force Mongoose to think it's an existing document
      mockDoc.isNew = false;

      await expect(mockDoc.save()).rejects.toThrow(/Audit logs are immutable/);
    });

    test('Query-level updates/deletions throw mutation error', async () => {
      await expect(AuditLog.updateOne({ _id: new mongoose.Types.ObjectId() }, { action: 'MUTATED' }))
        .rejects.toThrow(/Audit logs are immutable/);

      await expect(AuditLog.deleteOne({ _id: new mongoose.Types.ObjectId() }))
        .rejects.toThrow(/Audit logs are immutable/);
    });
  });

  describe('Correlation and Event Creation', () => {
    test('Service reads request ID and populates DB telemetry correctly', async () => {
      const orgId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const mockReq = {
        id: 'test_req_id_999',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'Jest-Tester' },
        user: {
          organizationId: orgId,
          userId: userId,
          role: 'ADMIN'
        }
      };

      const auditRecord = await auditLogService.record({
        req: mockReq,
        action: 'TARIFF_CREATED',
        targetModel: 'TariffConfig',
        targetId: new mongoose.Types.ObjectId(),
        after: { rate: 12.5 }
      });

      expect(auditRecord).toBeDefined();
      expect(auditRecord.requestId).toBe('test_req_id_999');
      expect(auditRecord.organizationId.toString()).toBe(orgId.toString());
      expect(auditRecord.actorId.toString()).toBe(userId.toString());
      expect(auditRecord.ipAddress).toBe('127.0.0.1');
      expect(auditRecord.userAgent).toBe('Jest-Tester');
      expect(auditRecord.action).toBe('TARIFF_CREATED');
    });
  });
});
