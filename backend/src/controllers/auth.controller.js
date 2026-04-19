import * as authService from '../services/authService.js';
import { env } from '../config/env.js';
import { generateTokens } from '../utils/jwt.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res, next) => {
  try {
    let user, org, tokens;
    
    // Multer attaches files to req.files. 
    const files = {
      logo: req.files?.logo?.[0] || null,
      signature: req.files?.signature?.[0] || null
    };

    if (!req.body || Object.keys(req.body).length === 0) {
      throw Object.assign(new Error('Registration data is missing'), { status: 400 });
    }

    if (req.body.role === 'CONSUMER') {
      org = await Organization.findOne({ slug: req.body.orgSlug });
      if (!org) throw Object.assign(new Error('Invalid Society ID'), { status: 400 });
      
      user = await authService.registerConsumer({ 
        ...req.body, 
        organizationId: org._id 
      });
      tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
    } else {
      const adminData = {
        name: req.body.name || req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        orgName: req.body.orgName,
        orgSlug: req.body.orgSlug,
        contactEmail: req.body.contactEmail || req.body.email,
        footerText: req.body.footerText || '',
        logo: files.logo,
        signature: files.signature
      };

      const result = await authService.registerAdmin(adminData);
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

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};