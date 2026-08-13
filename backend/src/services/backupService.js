import crypto from 'crypto';
import { env } from '../config/env.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import TariffConfig from '../models/TariffConfig.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Dispute from '../models/Dispute.js';
import { logger } from '../utils/logger.js';

// Use SHA-256 to derive an exact 32-byte key from BACKUP_ENCRYPTION_KEY config safely
const getEncryptionKey = () => {
  return crypto.createHash('sha256').update(env.BACKUP_ENCRYPTION_KEY).digest();
};

/**
 * Strips password hashes and system tokens from exported user lists.
 */
const sanitizeUsers = (users) => {
  return users.map(user => {
    const doc = user.toObject ? user.toObject() : { ...user };
    delete doc.passwordHash;
    delete doc.lastActiveAt;
    return doc;
  });
};

/**
 * Scrub Stripe secrets/keys from payment exports if any.
 */
const sanitizePayments = (payments) => {
  return payments.map(payment => {
    const doc = payment.toObject ? payment.toObject() : { ...payment };
    delete doc.stripeSessionId;
    delete doc.stripePaymentIntentId;
    delete doc.stripeEventId;
    return doc;
  });
};

/**
 * Generates an encrypted backup payload of all tenant organization records.
 */
export const generateEncryptedBackup = async (organizationId) => {
  // Fetch tenant isolated data
  const [org, rawUsers, tariffs, bills, rawPayments, disputes] = await Promise.all([
    Organization.findById(organizationId),
    User.find({ organizationId }),
    TariffConfig.find({ organizationId }),
    Bill.find({ organizationId }),
    Payment.find({ organizationId }),
    Dispute.find({ organizationId }),
  ]);

  if (!org) {
    throw Object.assign(new Error('Organization not found'), { status: 404 });
  }

  const users = sanitizeUsers(rawUsers);
  const payments = sanitizePayments(rawPayments);

  const exportPayload = {
    organization: org.toObject ? org.toObject() : org,
    users,
    tariffs: tariffs.map(t => t.toObject ? t.toObject() : t),
    bills: bills.map(b => b.toObject ? b.toObject() : b),
    payments,
    disputes: disputes.map(d => d.toObject ? d.toObject() : d),
  };

  const plaintext = JSON.stringify(exportPayload);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 12 bytes IV for AES-GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  logger.info(`[Backup] Encrypted backup generated successfully for Org: ${organizationId}`);

  return {
    version: '1.0.0',
    organizationId: organizationId.toString(),
    createdAt: new Date().toISOString(),
    iv: iv.toString('hex'),
    tag: tag,
    encryptedPayload: encrypted,
  };
};

/**
 * Decrypts and validates the backup file structure.
 * Throws errors if tampered (signature tag fails) or invalid format.
 */
export const verifyBackup = async (backupData, currentOrganizationId) => {
  if (!backupData || !backupData.encryptedPayload || !backupData.iv || !backupData.tag) {
    throw new Error('Invalid backup file: Missing cipher components (payload, iv, or auth tag)');
  }

  if (backupData.version !== '1.0.0') {
    throw new Error(`Unsupported backup format version: ${backupData.version}`);
  }

  // Enforce Tenant Isolation: Ensure the backup matches the authenticated tenant context
  if (backupData.organizationId !== currentOrganizationId.toString()) {
    throw Object.assign(new Error('Unauthorized: This backup file belongs to another organization'), { status: 403 });
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(backupData.iv, 'hex');
    const tag = Buffer.from(backupData.tag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(backupData.encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);
    
    // Provide a structure validation overview without exposing nested values
    return {
      isValid: true,
      createdAt: backupData.createdAt,
      organizationId: backupData.organizationId,
      recordCounts: {
        users: payload.users?.length || 0,
        tariffs: payload.tariffs?.length || 0,
        bills: payload.bills?.length || 0,
        payments: payload.payments?.length || 0,
        disputes: payload.disputes?.length || 0,
      }
    };
  } catch (err) {
    logger.warn('[Backup] Decryption authentication verification failed (tampered file or invalid key)', {
      error: err.message
    });
    throw new Error('Decryption failed: Backup payload is corrupted, tampered, or encrypted with an incompatible key.');
  }
};
