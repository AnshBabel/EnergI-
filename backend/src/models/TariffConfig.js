import mongoose from 'mongoose';

const slabSchema = new mongoose.Schema(
  {
    upToUnits: { type: Number, default: null }, // null = unlimited (last slab)
    rateInPaise: { type: Number, required: true }, // e.g. 500 = ₹5.00
  },
  { _id: false }
);

const tariffConfigSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true, trim: true }, // e.g. "FY 2025-26 Rates"
    effectiveFrom: { type: Date, required: true },
    currency: { type: String, default: 'INR' },
    slabs: { type: [slabSchema], required: true, validate: v => v.length > 0 },
    fixedChargeInPaise: { type: Number, default: 0 }, // Monthly fixed charge
    taxPercent: { type: Number, default: 0 }, // e.g. 18 = 18%
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Only one active tariff per org at a time (enforced in service layer)
tariffConfigSchema.index({ organizationId: 1, isActive: 1 });

export default mongoose.model('TariffConfig', tariffConfigSchema);
