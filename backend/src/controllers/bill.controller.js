import * as billService from '../services/billService.js';
import * as userService from '../services/userService.js';
import { generateBillPdf } from '../utils/pdfService.js';
import { exportBillsCsv } from '../utils/exportService.js';
import Organization from '../models/Organization.js';

export const generate = async (req, res, next) => {
  try {
    const { previousReading, currentReading, billingPeriod } = req.body;
    if (previousReading === undefined || currentReading === undefined || !billingPeriod) {
      return res.status(400).json({ error: 'Missing required fields: previousReading, currentReading, or billingPeriod' });
    }
    const bill = await billService.generateBill(
      req.user.organizationId,
      req.params.userId,
      req.body
    );
    res.status(201).json({ bill });
  } catch (err) { next(err); }
};

export const listByOrg = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const result = await billService.getBillsByOrg(req.user.organizationId, { ...req.query, forceDemo });
    res.json(result);
  } catch (err) { next(err); }
};


export const listByUser = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const userId = req.user.role === 'ADMIN' ? req.params.userId : req.user.userId;
    const result = await billService.getBillsByUser(req.user.organizationId, userId, { ...req.query, forceDemo });
    res.json(result);
  } catch (err) { next(err); }
};


export const getOne = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.user.organizationId, req.params.id);
    res.json({ bill });
  } catch (err) { next(err); }
};

export const analytics = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const data = await billService.getOrgAnalytics(req.user.organizationId, forceDemo);
    res.json(data);
  } catch (err) { next(err); }
};


export const downloadPdf = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    let bill, user, org;

    if (forceDemo) {
      const mock = billService.generateMockData(req.user.organizationId);
      bill = mock.bills.find(b => b._id.toString() === req.params.id);
      if (!bill) throw Object.assign(new Error('Mock bill not found'), { status: 404 });
      user = mock.users.find(u => u._id.toString() === (bill.userId._id || bill.userId).toString());
      org = await Organization.findById(req.user.organizationId); // Org info is usually real in demo
    } else {
      bill = await billService.getBillById(req.user.organizationId, req.params.id);
      [user, org] = await Promise.all([
        userService.getConsumerById(req.user.organizationId, bill.userId._id || bill.userId),
        Organization.findById(req.user.organizationId),
      ]);
    }
    
    await generateBillPdf(bill, user, org, res);
  } catch (err) { next(err); }
};


export const exportCsv = async (req, res, next) => {
  try {
    const { bills } = await billService.getBillsByOrg(req.user.organizationId, { limit: 1000 });
    exportBillsCsv(bills, res);
  } catch (err) { next(err); }
};

export const history = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const data = await billService.getOrgHistory(req.user.organizationId, forceDemo);
    res.json(data);
  } catch (err) { next(err); }
};


import * as cronService from '../services/cronService.js';

export const runCycle = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const forceDemo = req.query.demo === 'true';
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Missing required fields: month and year' });
    }
    const result = await cronService.runBillingCycle(req.user.organizationId, { month, year, forceDemo });
    res.json(result);
  } catch (err) { next(err); }
};

export const userHistory = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const data = await billService.getUserHistory(req.user.organizationId, req.user.userId, forceDemo);
    res.json(data);
  } catch (err) { next(err); }
};


export const getIntelligence = async (req, res, next) => {
  try {
    const forceDemo = req.query.demo === 'true';
    const result = await billService.getIntelligence(req.user.userId, req.user.organizationId, forceDemo);
    res.json(result);
  } catch (err) { next(err); }
};
