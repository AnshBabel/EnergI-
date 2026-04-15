import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

const FROM = 'EnergI <noreply@energi.app>';

export const sendBillGeneratedEmail = async ({ to, userName, billAmount, billingPeriod, dueDate, billId, orgName }) => {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${orgName} bill for ${billingPeriod.month}/${billingPeriod.year} is ready`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#7C3AED">Your Electricity Bill is Ready</h2>
        <p>Hi ${userName},</p>
        <p>Your bill for <strong>${billingPeriod.month}/${billingPeriod.year}</strong> has been generated.</p>
        <div style="background:#fff;padding:20px;border-radius:8px;margin:16px 0">
          <p style="margin:0;font-size:14px;color:#666">Amount Due</p>
          <p style="margin:4px 0;font-size:28px;font-weight:bold;color:#7C3AED">${billAmount}</p>
          <p style="margin:0;font-size:14px;color:#666">Due by: <strong>${new Date(dueDate).toLocaleDateString('en-IN')}</strong></p>
        </div>
        <a href="${env.FRONTEND_URL}/consumer/pay/${billId}" 
           style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Pay Now
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">EnergI — ${orgName}</p>
      </div>
    `,
  });
};

export const sendPaymentSuccessEmail = async ({ to, userName, billAmount, billingPeriod, orgName }) => {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#059669">✅ Payment Confirmed</h2>
        <p>Hi ${userName},</p>
        <p>Your payment of <strong>${billAmount}</strong> for ${billingPeriod.month}/${billingPeriod.year} has been received.</p>
        <p style="margin-top:24px;font-size:12px;color:#999">Thank you for paying on time — ${orgName}</p>
      </div>
    `,
  });
};

export const sendOverdueReminderEmail = async ({ to, userName, billAmount, dueDate, billId, orgName }) => {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Overdue bill — ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#DC2626">⚠️ Payment Overdue</h2>
        <p>Hi ${userName},</p>
        <p>Your bill of <strong>${billAmount}</strong> was due on ${new Date(dueDate).toLocaleDateString('en-IN')} and has not been paid.</p>
        <a href="${env.FRONTEND_URL}/consumer/pay/${billId}" 
           style="display:inline-block;background:#DC2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Pay Now
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">EnergI — ${orgName}</p>
      </div>
    `,
  });
};
