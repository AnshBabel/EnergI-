import * as backupService from '../services/backupService.js';
import * as auditLogService from '../services/auditLogService.js';

export const exportBackup = async (req, res, next) => {
  try {
    const backup = await backupService.generateEncryptedBackup(req.user.organizationId);

    // Set download headers safely
    const safeFilename = `energi_backup_${req.user.organizationId.toString().slice(-6)}_${Date.now()}.json`;
    res.setHeader('Content-disposition', `attachment; filename=${safeFilename}`);
    res.setHeader('Content-type', 'application/json');

    // Write audit event
    await auditLogService.record({
      req,
      action: 'BACKUP_CREATED',
      targetModel: 'Organization',
      targetId: req.user.organizationId,
      after: {
        version: backup.version,
        createdAt: backup.createdAt,
        fileName: safeFilename
      }
    });

    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    next(err);
  }
};

export const verifyBackupData = async (req, res, next) => {
  try {
    const { backup } = req.body;
    if (!backup) {
      return res.status(400).json({ error: 'Missing backup payload' });
    }

    const validation = await backupService.verifyBackup(backup, req.user.organizationId);
    res.json({
      success: true,
      validation
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      error: err.message
    });
  }
};
