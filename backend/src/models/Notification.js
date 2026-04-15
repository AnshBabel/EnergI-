import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['BILL_GENERATED', 'PAYMENT_SUCCESS', 'PAYMENT_OVERDUE'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      default: 'EMAIL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    payload: { type: mongoose.Schema.Types.Mixed }, // email template data
    sentAt: { type: Date, default: null },
    error: { type: String, default: null }, // capture failure reason
  },
  { timestamps: true }
);

notificationSchema.index({ organizationId: 1, userId: 1, type: 1 });

export default mongoose.model('Notification', notificationSchema);
