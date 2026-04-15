import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'OPEN',
    },
    adminNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

disputeSchema.index({ organizationId: 1, status: 1 });
disputeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Dispute', disputeSchema);
