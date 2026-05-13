import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Bill from '../models/Bill.js';
import TariffConfig from '../models/TariffConfig.js';
import Dispute from '../models/Dispute.js';
import Organization from '../models/Organization.js';
import { generateMockData } from '../utils/mockData.js';
import { calculateBill } from '../utils/billingEngine.js';

// Initialize Gemini Client safely if key is provided
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 're_placeholder') {
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('[AI Service] Failed to initialize Google Generative AI client:', err.message);
    return null;
  }
};

/**
 * Predicts end-of-month consumption and calculates projected billing amount.
 */
export const calculatePredictiveBilling = async (userId, organizationId, forceDemo = false) => {
  let user, bills = [], tariffs = [];

  if (forceDemo) {
    const mock = generateMockData(organizationId);
    user = mock.users[0]; // Primary mock consumer
    bills = mock.bills.filter(b => b.userId._id.toString() === user._id.toString());
    tariffs = mock.tariffs;
  } else {
    user = await User.findById(userId);
    bills = await Bill.find({ userId }).sort({ createdAt: -1 });
    tariffs = await TariffConfig.find({ organizationId, isActive: true });
  }

  if (!user) {
    throw Object.assign(new Error('Consumer not found'), { status: 404 });
  }

  const activeTariff = tariffs[0] || {
    slabs: [
      { upToUnits: 100, rateInPaise: 450 },
      { upToUnits: 300, rateInPaise: 650 },
      { upToUnits: null, rateInPaise: 850 },
    ],
    fixedChargeInPaise: 15000,
    taxPercent: 18,
  };

  // Live forecasting calculations
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Dynamic simulation values
  const currentReading = forceDemo 
    ? (user.lastKnownReading || 1200) + (Math.random() * 20) 
    : (user.lastKnownReading || 0);

  // We find or default the previous billed reading
  const lastBill = bills[0];
  const previousReading = lastBill ? lastBill.currentReading : (currentReading - 120);

  // Units consumed in the current month so far
  const unitsSoFar = Math.max(0, currentReading - previousReading);
  
  // Extrapolate to end of month: (units so far / days elapsed) * total days in month
  const ratePerDay = currentDay > 0 ? (unitsSoFar / currentDay) : user.consumptionRate * 2.4; // fallback to rate
  let projectedUnits = Math.round(ratePerDay * daysInMonth);
  if (projectedUnits <= 0) projectedUnits = Math.round(user.consumptionRate * 24 * daysInMonth); // standard usage fallback

  // Apply billing logic to get projected cost
  const calc = calculateBill(projectedUnits, activeTariff);

  // Anomaly checks
  const anomalies = [];
  const historicalBills = bills.filter(b => b.status === 'PAID');
  
  if (historicalBills.length > 0) {
    const avgUnits = historicalBills.reduce((acc, b) => acc + b.unitsConsumed, 0) / historicalBills.length;
    // Spike alert if projected is 40% higher than historical average
    if (projectedUnits > avgUnits * 1.4) {
      anomalies.push({
        type: 'CONSUMPTION_SPIKE',
        severity: 'HIGH',
        description: `Your projected consumption (${projectedUnits} kWh) is 40%+ higher than your historical average of ${Math.round(avgUnits)} kWh. You might have left a high-power appliance active.`,
        date: new Date(),
      });
    }
  }

  // Smart meter inactivity check
  if (user.isSmartMeterEnabled && currentReading === previousReading && currentDay > 5) {
    anomalies.push({
      type: 'INACTIVE_METER',
      severity: 'MEDIUM',
      description: 'Your Smart Meter has not logged any consumption changes recently. This could suggest meter inactivity or connection lag.',
      date: new Date(),
    });
  }

  return {
    currentReading,
    previousReading,
    unitsConsumedSoFar: Math.round(unitsSoFar),
    projectedUnits,
    projectedTotalInPaise: calc.totalInPaise,
    calculationBreakdown: calc.breakdown,
    daysElapsed: currentDay,
    daysTotal: daysInMonth,
    anomalies,
  };
};

/**
 * Builds an explicit context payload of the consumer/organization to feed into Gemini.
 */
const buildUserContext = async (userId, organizationId, forceDemo = false, userRole = 'CONSUMER') => {
  let user, bills = [], tariffs = [], disputes = [], org;

  if (forceDemo) {
    const mock = generateMockData(organizationId);
    if (userRole === 'ADMIN') {
      user = { name: 'Admin Manager', role: 'ADMIN', email: 'admin@energi.com', isSmartMeterEnabled: true, lastKnownReading: 45000, consumerId: 'ADMIN-GRID' };
      bills = mock.bills;
    } else {
      user = mock.users[0];
      bills = mock.bills.filter(b => b.userId._id.toString() === user._id.toString());
    }
    tariffs = mock.tariffs;
    disputes = mock.disputes;
    org = { name: 'Demo Society Grid', slug: 'demo-slug' };
  } else {
    user = await User.findById(userId);
    const actualRole = user ? user.role : userRole;
    if (actualRole === 'ADMIN') {
      bills = await Bill.find({ organizationId }).sort({ createdAt: -1 }).limit(15);
      disputes = await Dispute.find({ organizationId }).sort({ createdAt: -1 });
    } else {
      bills = await Bill.find({ userId }).sort({ createdAt: -1 }).limit(6);
      disputes = await Dispute.find({ userId }).sort({ createdAt: -1 });
    }
    tariffs = await TariffConfig.find({ organizationId, isActive: true });
    org = await Organization.findById(organizationId);
  }

  if (!user && userRole !== 'ADMIN') return '';

  const activeTariff = tariffs[0];
  const tariffDetails = activeTariff 
    ? `Active Tariff Profile: ${activeTariff.name}. Fixed monthly charge: Rs. ${activeTariff.fixedChargeInPaise / 10000}. Slabs: ${activeTariff.slabs.map(s => `Up to ${s.upToUnits || 'unlimited'} units at Rs. ${s.rateInPaise / 100}/unit`).join(', ')}. Tax Rate: ${activeTariff.taxPercent}%.`
    : 'No active tariff configured.';

  const billingHistory = bills.length > 0
    ? bills.map(b => {
        const matchingUser = b.userId?.name || (userRole === 'ADMIN' ? 'Grid Consumer' : 'Consumer');
        const formattedAmount = (b.totalInPaise / 100).toFixed(2);
        const formattedDate = new Date(b.dueDate).toLocaleDateString('en-GB');
        return `- Period: ${b.billingPeriod.month}/${b.billingPeriod.year}, Consumer: ${matchingUser}, Usage: ${b.unitsConsumed} kWh, Total Cost: Rs. ${formattedAmount}, Status: ${b.status}, Due Date: ${formattedDate}`;
      }).join('\n')
    : 'No billing records found.';

  const activeDisputes = disputes.length > 0
    ? disputes.map(d => `- Reason: "${d.reason}", Status: ${d.status}, Admin Note: "${d.adminNote || 'None'}"`).join('\n')
    : 'No active billing disputes.';

  const profileHeader = userRole === 'ADMIN'
    ? `Admin Profile: Manager of ${org?.name || 'EnergI Network'}\nMonitoring Total Organization Collections & Grid Health`
    : `User Profile:\n- Name: ${user?.name}\n- Email: ${user?.email}\n- Role: ${user?.role}\n- Consumer ID: ${user?.consumerId}\n- Smart Meter Active: ${user?.isSmartMeterEnabled}`;

  return `
[SYSTEM CONTEXT: ENERGI UTILITY BILLING PLATFORM]
${profileHeader}
- Utility Provider (Organization): ${org?.name || 'EnergI'}

${tariffDetails}

Historical Bills (Network Records):
${billingHistory}

Unresolved Disputes:
${activeDisputes}
`;
};

/**
 * Local Rule-Based Heuristic NLP fallback engine.
 * Deciphers key phrases and performs actual queries to build dynamic replies.
 */
const handleLocalNLPResponse = async (userId, organizationId, userMessage, forceDemo = false, userRole = 'CONSUMER') => {
  let user, bills = [], tariffs = [], disputes = [], org;

  if (forceDemo) {
    const mock = generateMockData(organizationId);
    if (userRole === 'ADMIN') {
      user = { name: 'Admin Manager', role: 'ADMIN' };
      bills = mock.bills;
    } else {
      user = mock.users[0];
      bills = mock.bills.filter(b => b.userId._id.toString() === user._id.toString());
    }
    tariffs = mock.tariffs;
    disputes = mock.disputes;
    org = { name: 'Demo Society Grid' };
  } else {
    user = await User.findById(userId);
    const actualRole = user ? user.role : userRole;
    if (actualRole === 'ADMIN') {
      bills = await Bill.find({ organizationId }).sort({ createdAt: -1 });
      disputes = await Dispute.find({ organizationId }).sort({ createdAt: -1 });
    } else {
      bills = await Bill.find({ userId }).sort({ createdAt: -1 });
      disputes = await Dispute.find({ userId }).sort({ createdAt: -1 });
    }
    tariffs = await TariffConfig.find({ organizationId, isActive: true });
    org = await Organization.findById(organizationId);
  }

  const msg = userMessage.toLowerCase();
  const formatMoney = (paise) => `Rs. ${(paise / 100).toFixed(2)}`;

  // 1. HELP / GREETING
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('help') || msg.includes('who are you')) {
    if (userRole === 'ADMIN') {
      return `### Hello, Admin Manager! 👋
I am your **EnergI Grid Copilot**. I monitor your society's entire energy network, aggregated billing collections, and smart meter anomalies.

**Here are some things you can ask me:**
* 🧾 *"Show me overdue bills across the grid"*
* 📈 *"Predict network billing cycles"*
* ⚡ *"What is our active tariff structure?"*
* ⚠️ *"Scan for active grid anomalies"*
* 📋 *"Check open consumer disputes"*

What can I assist you with today?`;
    }

    return `### Hello, ${user?.name || 'Valued Consumer'}! 👋
I am your **EnergI Copilot**, a highly integrated conversational energy assistant. I analyze your live IoT consumption, billing records, and active utility profile directly to give you insights!

**Here are some things you can ask me:**
* 🧾 *"Show me my unpaid bills"* or *"What is my balance?"*
* 📈 *"Predict my next bill"* or *"What is my current projection?"*
* ⚡ *"What is my active tariff structure?"* or *"Explain my slabs"*
* ⚠️ *"Are there any anomalies with my meter?"*
* 📋 *"Check the status of my disputes"*

What can I assist you with today?`;
  }

  // 2. PREDICTIONS / FORECASTS
  if (msg.includes('predict') || msg.includes('forecast') || msg.includes('projection') || msg.includes('next month') || msg.includes('extrapolat')) {
    try {
      const pred = await calculatePredictiveBilling(userId, organizationId, forceDemo);
      let reply = `### 🔮 Live AI Billing Forecast & Projection\n`;
      reply += `Based on live smart meter telemetry (**${pred.currentReading.toFixed(2)} kWh**), here is the month-end projection:\n\n`;
      reply += `* **Projected Monthly Consumption:** **${pred.projectedUnits} kWh**\n`;
      reply += `* **Projected Billing Amount:** **${formatMoney(pred.projectedTotalInPaise)}** (with slab tax & fixed charges calculated)\n`;
      reply += `* **Days Completed in Cycle:** ${pred.daysElapsed} of ${pred.daysTotal} days\n\n`;
      
      if (pred.anomalies.length > 0) {
        reply += `⚠️ **Copilot System Warnings:**\n`;
        pred.anomalies.forEach(a => {
          reply += `* **[${a.severity}]** ${a.description}\n`;
        });
      } else {
        reply += `☘️ Energy consumption pacing is **completely normal** and stable.`;
      }
      return reply;
    } catch (err) {
      return `I ran into an issue calculating forecasting metrics. Please make sure the smart meter is fully set up.`;
    }
  }

  // 3. UNPAID / CURRENT BILLS
  if (msg.includes('unpaid') || msg.includes('due') || msg.includes('balance') || msg.includes('bill') || msg.includes('4/2026')) {
    // If they ask for specific 4/2026 bill
    if (msg.includes('4/2026') || msg.includes('april')) {
      const targetBill = bills.find(b => b.billingPeriod.month === 4 && b.billingPeriod.year === 2026) || bills[0];
      if (targetBill) {
        return `### 👋 Bill Details for April 2026:
* **Period:** 4/2026
* **Consumption:** ${targetBill.unitsConsumed} kWh
* **Total Cost:** **${formatMoney(targetBill.totalInPaise)}**
* **Status:** \`${targetBill.status}\`
* **Due Date:** ${new Date(targetBill.dueDate).toLocaleDateString('en-GB')}`;
      }
    }

    const unpaidBills = bills.filter(b => b.status === 'UNPAID');
    if (unpaidBills.length === 0) {
      return `### Excellent news! 🎉
There are **no unpaid bills** on this profile right now. The account is fully clear! 

The last billed period was **${bills[0]?.billingPeriod.month}/${bills[0]?.billingPeriod.year}** for **${formatMoney(bills[0]?.totalInPaise)}**, which has been fully paid.`;
    }

    let summary = `### 🧾 Outstanding Bills:\nThere are **${unpaidBills.length} unpaid bill(s)** logged:\n\n`;
    unpaidBills.forEach((b, i) => {
      summary += `${i + 1}. **Bill Period:** ${b.billingPeriod.month}/${b.billingPeriod.year}\n`;
      summary += `   * **Amount Due:** ${formatMoney(b.totalInPaise)}\n`;
      summary += `   * **Due Date:** ${new Date(b.dueDate).toLocaleDateString('en-GB')}\n`;
      summary += `   * **Usage:** ${b.unitsConsumed} kWh\n\n`;
    });
    return summary;
  }

  // 4. TARIFF / SLABS / TAX
  if (msg.includes('tariff') || msg.includes('slab') || msg.includes('rate') || msg.includes('cost')) {
    const tariff = tariffs[0];
    if (!tariff) {
      return `### ⚡ Active Tariff Structure
There is no custom tariff profile loaded for your organization yet. Standard default rates apply:
* Flat Rate: **Rs. 6.00 per unit**
* Fixed Monthly Charge: **Rs. 150.00**`;
    }

    let desc = `### ⚡ Active Tariff Profile: **${tariff.name}**\n`;
    desc += `Your energy provider (**${org?.name || 'EnergI'}**) charges you slab-by-slab to promote energy saving:\n\n`;
    tariff.slabs.forEach((slab, i) => {
      const range = slab.upToUnits ? `First ${slab.upToUnits} units` : `Remaining units beyond previous slabs`;
      desc += `* **Slab ${i + 1}:** ${range} charged at **Rs. ${(slab.rateInPaise / 100).toFixed(2)}/kWh**\n`;
    });
    desc += `\n* **Fixed Monthly Charge:** ${formatMoney(tariff.fixedChargeInPaise)}\n`;
    desc += `* **Taxes:** ${tariff.taxPercent}% state utility tax\n`;
    desc += `* **Early Bird Incentive:** Save **${tariff.earlyBirdDiscountPercent}%** if paid within ${tariff.earlyBirdGraceDays} days of billing!`;
    return desc;
  }

  // 5. DISPUTES / COMPLAINTS
  if (msg.includes('dispute') || msg.includes('complaint') || msg.includes('frozen') || msg.includes('issue')) {
    if (disputes.length === 0) {
      return `### 📋 Disputes Status
There are **no active disputes** or billing issues lodged.`;
    }

    let report = `### 📋 Dispute Logs:\n`;
    disputes.forEach((d, i) => {
      report += `${i + 1}. **Issue Raised:** "${d.reason}"\n`;
      report += `   * **Status:** \`${d.status}\`\n`;
      report += `   * **Response Note:** _${d.adminNote || 'Awaiting administrator review.'}_\n\n`;
    });
    return report;
  }

  // 6. ANOMALIES
  if (msg.includes('anomaly') || msg.includes('spike') || msg.includes('leak') || msg.includes('unusual')) {
    const pred = await calculatePredictiveBilling(userId, organizationId, forceDemo);
    if (pred.anomalies.length === 0) {
      return `### 🛡️ Copilot System Status: Healthy
No consumption anomalies, leakage currents, or connection dropouts were detected. Your grid footprint looks optimal!`;
    }

    let warn = `### ⚠️ Consumption Anomalies Detected:\n`;
    pred.anomalies.forEach((a, i) => {
      warn += `${i + 1}. **[${a.severity} Severity]** ${a.description}\n`;
    });
    return warn;
  }

  // DEFAULT
  return `### Hello! I'm your EnergI Copilot. ⚡
I didn't quite catch that specific request, but I am directly wired to your live smart meter and billing history!

**Feel free to ask me questions like:**
* *"Why is my bill high this month?"*
* *"Show my unpaid bills"*
* *"Predict my bill for next month"*
* *"What are my active tariff rates?"*
* *"Explain my disputes"*

What would you like me to look up?`;
};

/**
 * Primary chat router that connects to Google Gemini or gracefully routes to local NLP fallback.
 */
export const getCopilotResponse = async (userId, organizationId, userMessage, forceDemo = false, userRole = 'CONSUMER') => {
  const gemini = getGeminiClient();

  if (!gemini) {
    // Gracefully handle local parsing with high fidelity
    return await handleLocalNLPResponse(userId, organizationId, userMessage, forceDemo, userRole);
  }

  try {
    const context = await buildUserContext(userId, organizationId, forceDemo, userRole);
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const roleSpecialization = userRole === 'ADMIN'
      ? `You are the "EnergI Grid Copilot", an elite administrative AI utility manager. Your goal is to give administrative managers insights into overall grid telemetry, collections, overdue debts, and network anomalies.`
      : `You are the "EnergI Copilot", an elite conversational AI utility billing specialist speaking directly to consumers.`;

    const systemInstruction = `
${roleSpecialization}
Your mission is to analyze telemetry to provide clear, actionable insights in clean, beautiful Markdown formatting.
Use friendly greeting emojis. Answer comprehensively using the custom, verified system context below.
Be factual. Do not make up records. If the user asks for calculations or predictions, do them accurately.

Here is the LIVE context data for this conversation:
${context}

Instructions:
1. Speak directly to the user based on their role. Keep responses professional, helpful, and visually engaging (use bullet points and bolding).
2. If the user asks about a specific bill or why their bill is high, check past historical bills and highlight the specific amount in Rupees (divide paise by 100).
3. Always format dates clearly as DD/MM/YYYY.
`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: "Hello! Who are you?" }],
        },
        {
          role: 'model',
          parts: [{ text: `Hello! I am your EnergI Copilot. I analyze your utility network and billing details to give you direct insights. How can I help you today?` }],
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      }
    });

    const finalPrompt = `${systemInstruction}\n\nUser Message: "${userMessage}"`;
    const result = await chat.sendMessage(finalPrompt);
    const response = await result.response;
    return response.text();

  } catch (err) {
    console.error('[AI Service] Gemini invocation failed, resorting to local NLP:', err.message);
    return await handleLocalNLPResponse(userId, organizationId, userMessage, forceDemo, userRole);
  }
};
