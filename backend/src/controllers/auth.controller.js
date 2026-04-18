import * as authService from '../services/authService.js';
import { env } from '../config/env.js';
import { generateTokens } from '../utils/jwt.js';
import Organization from '../models/Organization.js';

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
    // We wrap this in a safety check to avoid "undefined" errors.
    const files = {
      logo: req.files?.logo?.[0] || null,
      signature: req.files?.signature?.[0] || null
    };

    // PERMANENT FIX: Ensure we have a body. 
    // If req.body is empty, it means the multipart middleware failed or headers are wrong.
    if (!req.body || Object.keys(req.body).length === 0) {
      throw Object.assign(new Error('Registration data is missing. Please check your form submission.'), { status: 400 });
    }

    if (req.body.role === 'CONSUMER') {
      org = await Organization.findOne({ slug: req.body.orgSlug });
      if (!org) throw Object.assign(new Error('Invalid Society ID / Slug'), { status: 400 });
      
      user = await authService.registerConsumer({ 
        ...req.body, 
        organizationId: org._id 
      });
      tokens = generateTokens(user._id.toString(), org._id.toString(), user.role);
    } else {
      // PERMANENT FIX: Explicit mapping with detailed fallbacks.
      // This ensures that even if the frontend key changes, we catch it here.
      const adminData = {
        name: req.body.name || req.body.fullName, // Support both naming conventions
        email: req.body.email,
        password: req.body.password,
        orgName: req.body.orgName,
        orgSlug: req.body.orgSlug,
        contactEmail: req.body.contactEmail || req.body.email, // Fallback to admin email
        footerText: req.body.footerText || '',
        logo: files.logo,
        signature: files.signature
      };

      // Safety Guard: Check required fields before sending to service
      if (!adminData.name || !adminData.email) {
        throw Object.assign(new Error(`Missing required fields: ${!adminData.name ? 'Name ' : ''}${!adminData.email ? 'Email' : ''}`), { status: 400 });
      }

      const result = await authService.registerAdmin(adminData);
      user = result.user;
      org = result.org;
      tokens = result.tokens;
    }

    // Set refresh token in secure cookie
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    
    res.status(201).json({
      message: 'Account created successfully',
      accessToken: tokens.accessToken,
      user,
      org,
    });
  } catch (err) {
    // This will now catch the "Missing required fields" or "Validation" errors clearly
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