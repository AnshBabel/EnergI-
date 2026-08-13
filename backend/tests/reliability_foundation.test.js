import { jest } from '@jest/globals';
import { correlationMiddleware } from '../src/middleware/correlation.js';
import { logger } from '../src/utils/logger.js';
import { isDbConnected } from '../src/config/db.js';

describe('Enterprise Reliability Foundation Tests', () => {
  describe('Request Correlation Middleware', () => {
    test('Injects unique X-Request-ID header when not provided', () => {
      const req = { headers: {} };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      correlationMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(req.id).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    test('Reuses provided X-Request-ID header', () => {
      const req = { headers: { 'x-request-id': 'test_req_id_123' } };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      correlationMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'test_req_id_123');
      expect(req.id).toBe('test_req_id_123');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Structured Logger Sanitization', () => {
    test('Strips sensitive fields (e.g. password, jwt) from logging outputs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      logger.info('User action log', {
        username: 'testuser',
        password: 'super_secret_password_123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedOutput = consoleSpy.mock.calls[0][0];
      
      expect(loggedOutput).not.toContain('super_secret_password_123');
      expect(loggedOutput).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Health Probes Readiness Status', () => {
    test('Exposes database connection status correctly', () => {
      const dbStatus = isDbConnected();
      expect(typeof dbStatus).toBe('boolean');
    });
  });
});
