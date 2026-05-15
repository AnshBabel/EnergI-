import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SystemConfig', systemConfigSchema);
