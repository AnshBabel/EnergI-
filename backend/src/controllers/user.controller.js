import * as userService from '../services/userService.js';

export const create = async (req, res, next) => {
  try {
    const user = await userService.createConsumer(req.user.organizationId, req.body);
    res.status(201).json({ user });
  } catch (err) { next(err); }
};

export const list = async (req, res, next) => {
  try {
    const result = await userService.listConsumers(req.user.organizationId, req.query);
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
    const user = await userService.updateConsumer(req.user.organizationId, req.params.id, req.body);
    res.json({ user });
  } catch (err) { next(err); }
};
