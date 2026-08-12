import { Router } from 'express';
import * as superAdminController from '../controllers/superadmin.controller.js';
import { authenticate, requireSuperAdmin, blockImpersonatedHighRiskOps } from '../middleware/auth.js';

const router = Router();

// All routes protected by authenticate and requireSuperAdmin
router.use(authenticate, requireSuperAdmin);

router.get('/overview', superAdminController.getOverview);
router.get('/organizations', superAdminController.getOrganizations);
router.patch('/organizations/:orgId/toggle', blockImpersonatedHighRiskOps, superAdminController.toggleOrganizationStatus);
router.post('/impersonate', blockImpersonatedHighRiskOps, superAdminController.impersonateUser);
router.post('/maintenance/toggle', blockImpersonatedHighRiskOps, superAdminController.toggleMaintenanceMode);

// MongoDB Explorer Routes (Read-Only Metrics)
router.get('/mongodb/collections', superAdminController.getMongoCollections);
router.get('/mongodb/collection/:collectionName', superAdminController.getCollectionDocuments);

export default router;
