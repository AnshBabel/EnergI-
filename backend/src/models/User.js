import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    passwordHash: { type: String, required: true },
    consumerId: {
      type: String,
      unique: true,
      default: () => `EN-${nanoid(6).toUpperCase()}`,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'CONSUMER'],
      default: 'CONSUMER',
    },
    meterNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    lastBillingDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound indexes
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, consumerId: 1 }, { unique: true });

// Never return passwordHash in API responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
