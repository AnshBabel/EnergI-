import Notification from '../models/Notification.js';

export const listAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { organizationId: req.user.organizationId };
    if (req.user.role === 'CONSUMER') {
      query.userId = req.user.userId;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('userId', 'name email consumerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
    ]);

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
