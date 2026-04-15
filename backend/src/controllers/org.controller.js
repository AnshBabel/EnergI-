import Organization from '../models/Organization.js';

export const getBranding = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId).select('name slug logoUrl primaryColor');
    res.json({ org });
  } catch (err) { next(err); }
};

export const updateBranding = async (req, res, next) => {
  try {
    const allowed = ['name', 'logoUrl', 'primaryColor', 'contactEmail'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const org = await Organization.findByIdAndUpdate(req.user.organizationId, updates, { new: true });
    res.json({ org });
  } catch (err) { next(err); }
};
