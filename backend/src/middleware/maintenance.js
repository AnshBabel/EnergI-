import SystemConfig from '../models/SystemConfig.js';

export const checkMaintenance = async (req, res, next) => {
  try {
    // Skip check for Super Admin routes and login/auth routes to allow unlocking
    // Also allow profile request so app knows user is logged in
    const isExcludedPath = 
      req.originalUrl.startsWith('/api/v1/superadmin') || 
      req.originalUrl.startsWith('/api/v1/auth') ||
      req.originalUrl.includes('/users/profile');

    if (isExcludedPath) {
      return next();
    }

    // Check for Super Admin token to allow access even during maintenance
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { verifyAccessToken } = await import('../utils/jwt.js');
        const payload = verifyAccessToken(token);
        if (payload.role === 'SUPER_ADMIN') {
          return next();
        }
      } catch (err) {
        // Token invalid, continue to maintenance check
      }
    }

    const maintenanceConfig = await SystemConfig.findOne({ key: 'MAINTENANCE_MODE' });
    
    if (maintenanceConfig?.value === true) {
      return res.status(503).json({
        error: 'System Maintenance',
        message: 'EnergI is currently undergoing scheduled maintenance. We will be back online shortly.',
        maintenance: true
      });
    }

    next();
  } catch (err) {
    console.error('Maintenance Check Error:', err);
    next(); // Continue if check fails to avoid blocking system
  }
};
