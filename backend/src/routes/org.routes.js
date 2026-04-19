import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as orgController from '../controllers/org.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'logo' ? 'uploads/branding/' : 'uploads/signatures/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed for branding'), false);
    }
  }
});

const router = Router();
router.use(authenticate);

router.get('/branding', orgController.getBranding);
router.patch(
  '/branding', 
  requireAdmin, 
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  orgController.updateBranding
);

export default router;
