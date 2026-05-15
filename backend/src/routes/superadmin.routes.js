import { Router } from 'express';
import * as superAdminController from '../controllers/superadmin.controller.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// All routes protected by authenticate and requireSuperAdmin
router.use(authenticate, requireSuperAdmin);

router.get('/overview', superAdminController.getOverview);
router.get('/organizations', superAdminController.getOrganizations);
router.patch('/organizations/:orgId/toggle', superAdminController.toggleOrganizationStatus);
router.post('/impersonate', superAdminController.impersonateUser);
router.post('/maintenance/toggle', superAdminController.toggleMaintenanceMode);

// MongoDB Explorer Routes
router.get('/mongodb/collections', superAdminController.getMongoCollections);
router.get('/mongodb/collection/:collectionName', superAdminController.getCollectionDocuments);
router.post('/mongodb/document/:collectionName', superAdminController.createDocument);
router.put('/mongodb/document/:collectionName/:id', superAdminController.updateDocument);
router.delete('/mongodb/document/:collectionName/:id', superAdminController.deleteDocument);

export default router;
