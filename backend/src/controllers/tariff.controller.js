import * as tariffService from '../services/tariffService.js';
import * as auditLogService from '../services/auditLogService.js';
import TariffConfig from '../models/TariffConfig.js';

export const list = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const tariffs = await tariffService.listTariffs(req.user.organizationId, { forceDemo });
    res.json({ tariffs });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const tariff = await tariffService.createTariff(req.user.organizationId, req.body);
    
    await auditLogService.record({
      req,
      action: 'TARIFF_CREATED',
      targetModel: 'TariffConfig',
      targetId: tariff._id,
      after: tariff,
    });
    
    res.status(201).json({ tariff });
  } catch (err) { next(err); }
};

export const setActive = async (req, res, next) => {
  try {
    const prevActive = await TariffConfig.findOne({ organizationId: req.user.organizationId, isActive: true });
    
    const tariff = await tariffService.setActiveTariff(req.user.organizationId, req.params.id);
    
    if (prevActive && prevActive._id.toString() !== tariff._id.toString()) {
      await auditLogService.record({
        req,
        action: 'TARIFF_DEACTIVATED',
        targetModel: 'TariffConfig',
        targetId: prevActive._id,
        before: prevActive,
        after: { ...prevActive.toObject(), isActive: false }
      });
    }

    await auditLogService.record({
      req,
      action: 'TARIFF_ACTIVATED',
      targetModel: 'TariffConfig',
      targetId: tariff._id,
      before: prevActive && prevActive._id.toString() === tariff._id.toString() ? prevActive : undefined,
      after: tariff,
    });

    res.json({ tariff });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const tariff = await TariffConfig.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    
    await tariffService.deleteTariff(req.user.organizationId, req.params.id);
    
    if (tariff) {
      await auditLogService.record({
        req,
        action: 'TARIFF_DELETED',
        targetModel: 'TariffConfig',
        targetId: tariff._id,
        before: tariff,
      });
    }

    res.json({ message: 'Tariff deleted' });
  } catch (err) { next(err); }
};
