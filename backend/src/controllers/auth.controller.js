import * as authService from '../services/authService.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

import { generateTokens } from '../utils/jwt.js';
import Organization from '../models/Organization.js';

export const register = async (req, res, next) => {
  try {
    let user, org, tokens;
    
    if (req.body.role === 'CONSUMER') {
      org = await Organization.findOne({ slug: req.body.orgSlug });
      if (!org) throw Object.assign(new Error('Invalid Society ID / Slug'), { status: 400 });
      
      user = await authService.registerConsumer({ ...req.body, organizationId: org._id });
      tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
    } else {
      const result = await authService.registerAdmin(req.body);
      user = result.user;
      org = result.org;
      tokens = result.tokens;
    }

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      message: 'Account created successfully',
      accessToken: tokens.accessToken,
      user,
      org,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, org, tokens } = await authService.login(req.body);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken: tokens.accessToken,
      user,
      org,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    const accessToken = authService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};
