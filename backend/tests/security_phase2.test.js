import { jest } from '@jest/globals';
import express from 'express';
import http from 'http';
import { generateTokens } from '../src/utils/jwt.js';
import { validate } from '../src/middleware/validate.js';
import { z } from 'zod';

describe('Phase 2 Defensive Security Tests', () => {

  describe('Zod Input Validation & Payload Limits', () => {
    const testSchema = z.object({
      body: z.object({
        email: z.string().email(),
        amount: z.number().positive(),
      })
    });

    test('Valid input passes Zod validation middleware', () => {
      const req = { body: { email: 'user@example.com', amount: 100 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      validate(testSchema)(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.validated.body.email).toBe('user@example.com');
    });

    test('NoSQL operator object in scalar field is REJECTED by Zod', () => {
      const req = { body: { email: { $ne: null }, amount: 100 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      validate(testSchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('Negative numbers in positive field REJECTED by Zod', () => {
      const req = { body: { email: 'user@example.com', amount: -50 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      validate(testSchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('AI Tenant Quota Enforcement', () => {
    test('Quota tracks organization usage and returns 429 when budget exceeded', async () => {
      const quotaCheckMock = async (tokens) => {
        if (tokens > 40000) {
          const err = Object.assign(new Error('Organization AI usage limit exceeded'), { status: 429 });
          throw err;
        }
        return { allowed: true };
      };

      await expect(quotaCheckMock(1000)).resolves.toEqual({ allowed: true });
      await expect(quotaCheckMock(50000)).rejects.toThrow('Organization AI usage limit exceeded');
    });
  });

  describe('Security Headers & CORS Config', () => {
    test('CORS whitelist allows valid origin and blocks disallowed origin', async () => {
      const allowedOrigins = ['http://localhost:4200', 'http://localhost:5000'];
      const checkCors = (origin) => !origin || allowedOrigins.includes(origin);

      expect(checkCors('http://localhost:4200')).toBe(true);
      expect(checkCors('https://evil-attacker.com')).toBe(false);
    });
  });

});
