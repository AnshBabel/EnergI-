import * as disputeService from '../services/disputeService.js';
import * as auditLogService from '../services/auditLogService.js';
import Dispute from '../models/Dispute.js';

export const raise = async (req, res, next) => {
  try {
    const billId = req.params.billId;
    const dispute = await disputeService.raiseDispute(
      req.user.organizationId,
      req.user.userId,
      billId,
      req.body.reason
    );
    
    await auditLogService.record({
      req,
      action: 'DISPUTE_CREATED',
      targetModel: 'Dispute',
      targetId: dispute._id,
      after: dispute,
    });

    res.status(201).json({ dispute });
  } catch (err) { next(err); }
};

export const listForAdmin = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const disputes = await disputeService.listDisputesByOrg(req.user.organizationId, { ...req.query, forceDemo });
    res.json({ disputes });
  } catch (err) { next(err); }
};

export const listForConsumer = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const disputes = await disputeService.listDisputesByUser(req.user.organizationId, req.user.userId, { forceDemo });
    res.json({ disputes });
  } catch (err) { next(err); }
};

export const resolve = async (req, res, next) => {
  try {
    const beforeDispute = await Dispute.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    
    const dispute = await disputeService.resolveDispute(
      req.user.organizationId,
      req.params.id,
      req.body
    );
    
    await auditLogService.record({
      req,
      action: 'DISPUTE_RESOLVED',
      targetModel: 'Dispute',
      targetId: dispute._id,
      before: beforeDispute,
      after: dispute,
    });

    res.json({ dispute });
  } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const beforeDispute = await Dispute.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    
    const dispute = await disputeService.updateDisputeStatus(
      req.user.organizationId,
      req.params.id,
      req.body.status
    );
    
    await auditLogService.record({
      req,
      action: 'DISPUTE_UPDATED',
      targetModel: 'Dispute',
      targetId: dispute._id,
      before: beforeDispute,
      after: dispute,
    });

    res.json({ dispute });
  } catch (err) { next(err); }
};
