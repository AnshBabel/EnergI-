import mongoose from 'mongoose';

const stripeEventLogSchema = new mongoose.Schema({
  _id: {
    type: String, // Stripe event ID (e.g. evt_1N...)
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
    default: 'PROCESSING',
    required: true,
  },
  error: {
    type: String,
    default: null,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const StripeEventLog = mongoose.model('StripeEventLog', stripeEventLogSchema);
export default StripeEventLog;
