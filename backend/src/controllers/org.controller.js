import Organization from '../models/Organization.js';

export const getBranding = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId).select('name slug logoUrl primaryColor');
    res.json({ org });
  } catch (err) { next(err); }
};

export const updateBranding = async (req, res, next) => {
  try {
    const allowed = ['name', 'primaryColor', 'contactEmail', 'footerText'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    // Handle uploaded files
    if (req.files?.logo?.[0]) {
      updates.logoUrl = `/uploads/branding/${req.files.logo[0].filename}`;
    }
    if (req.files?.signature?.[0]) {
      updates.signatureUrl = `/uploads/signatures/${req.files.signature[0].filename}`;
    }

    const org = await Organization.findByIdAndUpdate(req.user.organizationId, updates, { new: true });
    res.json({ org });
  } catch (err) { next(err); }
};
