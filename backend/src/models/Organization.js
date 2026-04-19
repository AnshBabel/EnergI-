import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: null },
    // We'll keep primaryColor as the 'brandColor' for the initial fallback logic
    primaryColor: { type: String, default: '#7C3AED' }, 
    contactEmail: { 
      type: String, 
      required: true, 
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid contact email address']
    },
    planTier: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'starter',
    },
    isActive: { type: Boolean, default: true },
    
    // --- NEW BRANDING FIELDS ---
    signatureUrl: { 
      type: String, 
      default: null 
    }, // URL for the authorized signatory image
    footerText: { 
      type: String, 
      default: "Thank you for using our services. Please contact us for any billing queries." 
    },
    billingCycleDay: { type: Number, default: 1, min: 1, max: 28 }, // Day of month to run billing
    isAutoBillingEnabled: { type: Boolean, default: false },
    // ---------------------------
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);