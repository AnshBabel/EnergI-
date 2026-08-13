import * as userService from '../services/userService.js';
import * as auditLogService from '../services/auditLogService.js';
import User from '../models/User.js';

export const create = async (req, res, next) => {
  try {
    const user = await userService.createConsumer(req.user.organizationId, req.body);
    
    await auditLogService.record({
      req,
      action: 'USER_CREATED',
      targetModel: 'User',
      targetId: user._id,
      after: user,
    });

    res.status(201).json({ user });
  } catch (err) { next(err); }
};

export const list = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const result = await userService.listConsumers(req.user.organizationId, { ...req.query, forceDemo });
    res.json(result);
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const user = await userService.getConsumerById(req.user.organizationId, req.params.id);
    res.json({ user });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const beforeUser = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    const user = await userService.updateConsumer(req.user.organizationId, req.params.id, req.body);
    
    let action = 'USER_UPDATED';
    if (beforeUser && beforeUser.isActive === true && user.isActive === false) {
      action = 'USER_DEACTIVATED';
    }

    await auditLogService.record({
      req,
      action,
      targetModel: 'User',
      targetId: user._id,
      before: beforeUser,
      after: user,
    });

    res.json({ user });
  } catch (err) { next(err); }
};
