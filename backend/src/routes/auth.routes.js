import { Router } from 'express';
import multer from 'multer'; // New: Required for file uploads
import path from 'path';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';

// --- Multer Configuration ---
// This defines where and how files are stored locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on field name
    const folder = file.fieldname === 'logo' ? 'uploads/branding/' : 'uploads/signatures/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Create unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for safety
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = Router();

// --- Routes ---

// Updated: Added upload.fields to handle 'logo' and 'signature'
router.post(
  '/register', 
  authRateLimit, 
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), 
  authController.register
);

router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected
router.get('/me', authenticate, authController.me);

export default router;