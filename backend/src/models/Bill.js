import mongoose from 'mongoose';

const breakdownRowSchema = new mongoose.Schema(
  {
    units: Number,
    rateInPaise: Number,
    chargeInPaise: Number,
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tariffConfigId: { type: mongoose.Schema.Types.ObjectId, ref: 'TariffConfig', required: true },
    
    earlyBird: {
      eligibleUntil: { type: Date },
      discountPercent: { type: Number, default: 0 },
      discountAmountInPaise: { type: Number, default: 0 }
    },

    billingPeriod: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
    previousReading: { type: Number, required: true, min: 0 },
    currentReading: { type: Number, required: true, min: 0 },
    unitsConsumed: { type: Number, required: true, min: 0 },
    calculationBreakdown: [breakdownRowSchema], // full slab-by-slab audit trail
    subtotalInPaise: { type: Number, required: true },
    taxAmountInPaise: { type: Number, required: true },
    totalInPaise: { type: Number, required: true },
    fixedChargeInPaise: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID', 'DISPUTED', 'WAIVED'],
      default: 'UNPAID',
    },
    billDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate bills for same user + period
billSchema.index(
  { organizationId: 1, userId: 1, 'billingPeriod.month': 1, 'billingPeriod.year': 1 },
  { unique: true }
);

// Query performance indexes
billSchema.index({ organizationId: 1, status: 1 });
billSchema.index({ userId: 1, billDate: -1 });

export default mongoose.model('Bill', billSchema);
