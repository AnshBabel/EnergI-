import mongoose from 'mongoose';

const aiUsageLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  tokensUsed: {
    type: Number,
    required: true,
    default: 0,
  },
  requestCount: {
    type: Number,
    required: true,
    default: 1,
  },
  windowStart: {
    type: Date,
    required: true,
    index: true,
  },
}, { timestamps: true });

aiUsageLogSchema.index({ organizationId: 1, windowStart: 1 }, { unique: true });

const AiUsageLog = mongoose.model('AiUsageLog', aiUsageLogSchema);
export default AiUsageLog;
