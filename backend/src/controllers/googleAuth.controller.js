import * as googleAuthService from '../services/googleAuthService.js';
import * as auditLogService from '../services/auditLogService.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken, orgSlug } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Google verification token is missing' });
    }

    const { user, org, tokens } = await googleAuthService.authenticateWithGoogle(idToken, orgSlug);

    // Set Refresh Token Cookie
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    // Log GOOGLE_LOGIN_SUCCESS audit log event
    // Create req.user mock context for the audit logger since user is not yet bound to req
    const auditReq = {
      ...req,
      user: {
        userId: user._id,
        role: user.role,
        organizationId: org._id
      }
    };

    await auditLogService.record({
      req: auditReq,
      action: 'GOOGLE_LOGIN_SUCCESS',
      targetModel: 'User',
      targetId: user._id,
      after: {
        email: user.email,
        authProvider: 'GOOGLE'
      }
    });

    res.json({
      accessToken: tokens.accessToken,
      user,
      org,
    });

  } catch (err) {
    // If we have parsed user info but authentication failed, log failure
    loggerWarning(req, err.message);
    next(err);
  }
};

const loggerWarning = async (req, message) => {
  try {
    await auditLogService.record({
      req: {
        ...req,
        user: {
          userId: new (await import('mongoose')).default.Types.ObjectId(), // Placeholder for actor
          role: 'CONSUMER',
          organizationId: new (await import('mongoose')).default.Types.ObjectId() // Placeholder for org
        }
      },
      action: 'GOOGLE_LOGIN_FAILED',
      after: { error: message }
    });
  } catch {}
};

export const getGoogleClientId = async (req, res, next) => {
  try {
    res.json({ clientId: env.GOOGLE_CLIENT_ID });
  } catch (err) {
    next(err);
  }
};
