import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: null },
    // We'll keep primaryColor as the 'brandColor' for the initial fallback logic
    primaryColor: { type: String, default: '#7C3AED' }, 
    contactEmail: { type: String, required: true, lowercase: true },
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
    }, // Custom text appearing at the bottom of bills
    // ---------------------------
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);