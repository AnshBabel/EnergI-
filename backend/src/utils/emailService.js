import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

const FROM = 'EnergI <noreply@energi.app>';

export const sendBillGeneratedEmail = async ({ to, userName, billAmount, billingPeriod, dueDate, billId, org, usageTrend }) => {
  const brandColor = org.primaryColor || '#7C3AED';
  const logoUrl = org.logoUrl ? `${env.BACKEND_URL}${org.logoUrl}` : 'https://raw.githubusercontent.com/AnshBabel/EnergI/main/assets/brand-logo.png';

  const trendSection = usageTrend && usageTrend.isHigh ? `
    <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:24px 0;border:1px solid #fed7aa;display:flex;align-items:center;gap:12px">
      <div style="font-size:24px">⚠️</div>
      <div>
        <p style="margin:0;font-size:14px;font-weight:bold;color:#9a3412">Consumption Alert</p>
        <p style="margin:2px 0 0;font-size:13px;color:#c2410c">Your usage is <strong>${usageTrend.percent}% higher</strong> than last month. Check your dashboard for energy-saving tips.</p>
      </div>
    </div>
  ` : '';

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${org.name} bill for ${billingPeriod.month}/${billingPeriod.year} is ready`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${logoUrl}" alt="${org.name}" style="height:48px;margin-bottom:8px">
          <h2 style="color:${brandColor};margin:0">${org.name}</h2>
          <p style="color:#666;font-size:14px;margin:4px 0">Electricity Bill Ready</p>
        </div>
        
        <p>Hi ${userName},</p>
        <p>Your bill for <strong>${billingPeriod.month}/${billingPeriod.year}</strong> has been generated.</p>
        
        ${trendSection}

        <div style="background:#f9fafb;padding:24px;border-radius:12px;margin:24px 0;text-align:center;border:1px solid #f3f4f6">
          <p style="margin:0;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px">Amount Due</p>
          <p style="margin:8px 0;font-size:36px;font-weight:bold;color:${brandColor}">${billAmount}</p>
          <p style="margin:0;font-size:14px;color:#666">Due by: <strong>${new Date(dueDate).toLocaleDateString('en-IN')}</strong></p>
        </div>
        
        <div style="text-align:center">
          <a href="${env.FRONTEND_URL}/consumer/pay/${billId}" 
             style="display:inline-block;background:${brandColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
            Pay Your Bill
          </a>
        </div>
        
        <p style="margin-top:32px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:24px">
          EnergI — Powering your utility network with clarity.<br>
          Sent on behalf of <strong>${org.name}</strong>
        </p>
      </div>
    `,
  });
};

export const sendPaymentSuccessEmail = async ({ to, userName, billAmount, billingPeriod, org }) => {
  const brandColor = '#059669'; // Success green
  const logoUrl = org.logoUrl ? `${env.BACKEND_URL}${org.logoUrl}` : 'https://raw.githubusercontent.com/AnshBabel/EnergI/main/assets/brand-logo.png';

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — ${org.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${logoUrl}" alt="${org.name}" style="height:48px;margin-bottom:8px">
          <h2 style="color:${brandColor};margin:0">✅ Payment Received</h2>
        </div>
        <p>Hi ${userName},</p>
        <p>Great news! Your payment of <strong>${billAmount}</strong> for ${billingPeriod.month}/${billingPeriod.year} has been successfully received and confirmed by <strong>${org.name}</strong>.</p>
        <p>Your account is currently in good standing. Thank you for paying on time!</p>
        <p style="margin-top:32px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:24px">
          EnergI — Modern Utility Billing<br>
          Confirmed by <strong>${org.name}</strong>
        </p>
      </div>
    `,
  });
};

export const sendOverdueReminderEmail = async ({ to, userName, billAmount, dueDate, billId, org }) => {
  const brandColor = '#DC2626'; // Overdue red
  const logoUrl = org.logoUrl ? `${env.BACKEND_URL}${org.logoUrl}` : 'https://raw.githubusercontent.com/AnshBabel/EnergI/main/assets/brand-logo.png';

  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Overdue bill — ${org.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #fee2e2;border-radius:12px;background:#fffafb">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${logoUrl}" alt="${org.name}" style="height:48px;margin-bottom:8px">
          <h2 style="color:${brandColor};margin:0">⚠️ Payment Overdue</h2>
        </div>
        <p>Hi ${userName},</p>
        <p>Your bill of <strong>${billAmount}</strong> from <strong>${org.name}</strong> was due on ${new Date(dueDate).toLocaleDateString('en-IN')} and has not yet been paid.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${env.FRONTEND_URL}/consumer/pay/${billId}" 
             style="display:inline-block;background:${brandColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
            Pay Overdue Bill
          </a>
        </div>
        <p style="font-size:14px;color:#666">Please clear your balance immediately to avoid potential service interruptions.</p>
        <p style="margin-top:32px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:24px">
          EnergI Security Alert — Handled by <strong>${org.name}</strong>
        </p>
      </div>
    `,
  });
};
