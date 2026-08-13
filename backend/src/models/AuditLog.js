import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetModel: {
      type: String,
      required: false,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    requestId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

// Compound and single query indexes
auditLogSchema.index({ organizationId: 1, timestamp: -1 });

// Ensure strict application-level append-only immutability
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be updated.'));
  }
  next();
});

const blockMutation = function (next) {
  next(new Error('Audit logs are immutable and cannot be modified or deleted.'));
};

auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'remove'], blockMutation);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
