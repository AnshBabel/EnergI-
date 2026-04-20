import * as notificationService from '../services/notificationService.js';

export const listAll = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const { page = 1, limit = 20 } = req.query;
    
    const options = { 
      page: Number(page), 
      limit: Number(limit), 
      forceDemo 
    };

    if (req.user.role === 'CONSUMER') {
      options.userId = req.user.userId;
    }

    const { notifications, total } = await notificationService.listNotifications(
      req.user.organizationId, 
      options
    );

    res.json({
      notifications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};


export const markAsRead = async (req, res, next) => {
  try {
    // Basic implementation for read/unread if we added a 'read' field later
    // For now we'll just return success
    res.json({ success: true });
  } catch (err) { next(err); }
};
