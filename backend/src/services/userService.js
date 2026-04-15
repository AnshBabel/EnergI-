import User from '../models/User.js';
import * as authService from './authService.js';

export const createConsumer = async (organizationId, data) =>
  authService.registerConsumer({ ...data, organizationId });

export const listConsumers = async (organizationId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ organizationId, role: 'CONSUMER' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({ organizationId, role: 'CONSUMER' }),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const getConsumerById = async (organizationId, userId) => {
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
};

export const updateConsumer = async (organizationId, userId, updates) => {
  const allowed = ['name', 'phone', 'address', 'meterNumber', 'isActive'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  return User.findOneAndUpdate({ _id: userId, organizationId }, filtered, { new: true });
};
