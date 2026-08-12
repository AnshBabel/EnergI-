import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateTokens = (userId, organizationId, role, familyId = null) => {
  const payload = { userId, organizationId, role };
  const refreshPayload = { ...payload, familyId };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

  return { accessToken, refreshToken };
};

export const generateImpersonationToken = (userId, organizationId, role, impersonatorId) => {
  const payload = { userId, organizationId, role, isImpersonated: true, impersonatorId };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

