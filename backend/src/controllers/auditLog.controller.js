import AuditLog from '../models/AuditLog.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, actorId, targetModel, targetId } = req.query;
    
    // Strict Tenant Isolation: lock query to user's organizationId
    const query = { organizationId: req.user.organizationId };
    
    if (action) query.action = action;
    if (actorId) query.actorId = actorId;
    if (targetModel) query.targetModel = targetModel;
    if (targetId) query.targetId = targetId;

    const parsedLimit = Math.min(parseInt(limit) || 20, 100); // Safe maximum page size of 100
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email consumerId')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parsedLimit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page) || 1,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    next(err);
  }
};
