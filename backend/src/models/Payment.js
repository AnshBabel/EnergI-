import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stripeSessionId: { type: String, required: true },
    stripePaymentIntentId: { type: String, default: null },
    stripeEventId: { type: String, unique: true, required: true }, // IDEMPOTENCY KEY
    amountInPaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for webhook idempotency check
// Indexing already handled by unique: true on field level
// paymentSchema.index({ stripeEventId: 1 }, { unique: true });
paymentSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
