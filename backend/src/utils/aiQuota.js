import AiUsageLog from '../models/AiUsageLog.js';

export const checkAndTrackAiQuota = async (organizationId, estimatedTokens = 500) => {
  const HOURLY_TOKEN_BUDGET = 50000; // 50k tokens per hour per org
  const HOURLY_REQUEST_LIMIT = 60;   // 60 AI calls per hour per org

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

  let usageLog = await AiUsageLog.findOne({ organizationId, windowStart });

  if (!usageLog) {
    try {
      usageLog = await AiUsageLog.create({
        organizationId,
        windowStart,
        tokensUsed: estimatedTokens,
        requestCount: 1,
      });
      return { allowed: true, tokensRemaining: HOURLY_TOKEN_BUDGET - estimatedTokens };
    } catch (err) {
      if (err.code === 11000) {
        usageLog = await AiUsageLog.findOne({ organizationId, windowStart });
      } else {
        throw err;
      }
    }
  }

  if (usageLog.tokensUsed + estimatedTokens > HOURLY_TOKEN_BUDGET || usageLog.requestCount >= HOURLY_REQUEST_LIMIT) {
    const error = Object.assign(
      new Error('Organization AI usage limit exceeded for this hour. Please try again later.'),
      { status: 429 }
    );
    throw error;
  }

  usageLog.tokensUsed += estimatedTokens;
  usageLog.requestCount += 1;
  await usageLog.save();

  return { allowed: true, tokensRemaining: HOURLY_TOKEN_BUDGET - usageLog.tokensUsed };
};
