import * as tariffService from '../services/tariffService.js';

export const list = async (req, res, next) => {
  try {
    const tariffs = await tariffService.listTariffs(req.user.organizationId);
    res.json({ tariffs });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const tariff = await tariffService.createTariff(req.user.organizationId, req.body);
    res.status(201).json({ tariff });
  } catch (err) { next(err); }
};

export const setActive = async (req, res, next) => {
  try {
    const tariff = await tariffService.setActiveTariff(req.user.organizationId, req.params.id);
    res.json({ tariff });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await tariffService.deleteTariff(req.user.organizationId, req.params.id);
    res.json({ message: 'Tariff deleted' });
  } catch (err) { next(err); }
};
