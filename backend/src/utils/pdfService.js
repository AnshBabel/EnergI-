import path from 'path';
import PDFDocument from 'pdfkit';
import { formatPaise } from './billingEngine.js';

/**
 * Generates a styled PDF bill and pipes it to a response stream.
 * @param {object} bill      - Populated Bill document
 * @param {object} user      - User document
 * @param {object} org       - Organization document
 * @param {object} res       - Express response object
 */
export const generateBillPdf = async (bill, user, org, res) => {
  return new Promise((resolve, reject) => {
    // Standard A4: 595.28 x 841.89 points
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${bill._id}.pdf"`);
    
    doc.on('error', (err) => {
      console.error('PDF Doc Error:', err);
      reject(err);
    });
    res.on('error', (err) => {
      console.error('PDF Res Error:', err);
      reject(err);
    });
    doc.pipe(res);

    try {
      const getAbsPath = (url) => {
        if (!url) return null;
        const ext = path.extname(url).toLowerCase();
        if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null;
        const relativePath = url.startsWith('/') ? url.substring(1) : url;
        return path.resolve(process.cwd(), relativePath);
      };

      // --- 1. HEADER & LOGO ---
      const logoAbsPath = getAbsPath(org.logoUrl);
      if (logoAbsPath) {
        try {
          doc.image(logoAbsPath, 40, 40, { width: 45 });
        } catch (e) {
          renderInitialLogo(doc, org);
        }
      } else {
        renderInitialLogo(doc, org);
      }

      const primaryColor = org.primaryColor || '#7C3AED';
      doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text(org.name, 95, 42);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text('Smart Utility Billing Solution', 95, 62);
      
      // Bill Header Info (Right Aligned)
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000').text('INVOICE', 400, 42, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(`#${(bill._id || 'BILL').toString().slice(-8).toUpperCase()}`, 400, 62, { align: 'right' });

      doc.moveTo(40, 100).lineTo(555, 100).stroke('#eee');

      // --- 2. BILLING & CONSUMER INFO ---
      let currentY = 120;
      
      // Left: Bill To
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('BILL TO:', 40, currentY);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(user.name, 40, currentY + 15);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(`Consumer ID: ${user.consumerId}`, 40, currentY + 32);
      doc.text(`Meter No: ${user.meterNumber || 'N/A'}`, 40, currentY + 45);

      // Right: Bill Details
      const detailsX = 350;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('BILL DETAILS:', detailsX, currentY);
      
      const metaStats = [
        ['Billing Period', `${bill.billingPeriod?.month || 'M'}/${bill.billingPeriod?.year || 'Y'}`],
        ['Bill Date', new Date(bill.billDate).toLocaleDateString('en-IN')],
        ['Due Date', new Date(bill.dueDate).toLocaleDateString('en-IN')],
        ['Status', bill.status]
      ];

      let metaY = currentY + 15;
      metaStats.forEach(([label, value]) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#444').text(label, detailsX, metaY);
        doc.font('Helvetica').text(value, detailsX + 90, metaY);
        metaY += 13;
      });

      // --- PAID WATERMARK ---
      if (bill.status === 'PAID') {
        doc.save();
        doc.fontSize(80).fillColor('#10B981').opacity(0.1)
           .rotate(-30, { origin: [300, 350] })
           .text('PAID', 150, 350);
        doc.restore();
      }

      // --- 3. CALCULATION BREAKDOWN ---
      let tableTop = 230;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Calculation Summary', 40, tableTop);
      
      tableTop += 20;
      // Table Header
      doc.rect(40, tableTop, 515, 20).fill('#f9fafb');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#666');
      doc.text('Consumption Tier', 50, tableTop + 6);
      doc.text('Units', 200, tableTop + 6);
      doc.text('Rate', 350, tableTop + 6);
      doc.text('Amount', 480, tableTop + 6, { width: 60, align: 'right' });

      let rowY = tableTop + 25;
      doc.font('Helvetica').fillColor('#444');
      
      const breakdown = bill.calculationBreakdown || [];
      breakdown.forEach((row, i) => {
        doc.text(`Tier ${i + 1}`, 50, rowY);
        doc.text(`${row.units} Units`, 200, rowY);
        doc.text(`₹${(row.rateInPaise / 100).toFixed(2)}`, 350, rowY);
        doc.font('Helvetica-Bold').fillColor('#000').text(`₹${(row.chargeInPaise / 100).toFixed(2)}`, 480, rowY, { width: 60, align: 'right' });
        doc.font('Helvetica').fillColor('#444');
        rowY += 18;
      });

      doc.moveTo(40, rowY + 5).lineTo(555, rowY + 5).stroke('#eee');

      // --- 4. TOTALS SECTION ---
      rowY += 20;
      const totalsX = 350;
      const totals = [
        ['Energy Charge', bill.subtotalInPaise],
        ['Fixed Charge', bill.fixedChargeInPaise || 0],
        ['Tax Amount', bill.taxAmountInPaise]
      ];

      totals.forEach(([label, value]) => {
        doc.fontSize(9).font('Helvetica').fillColor('#666').text(label, totalsX, rowY);
        doc.font('Helvetica-Bold').fillColor('#444').text(`₹${(value / 100).toFixed(2)}`, 480, rowY, { width: 60, align: 'right' });
        rowY += 15;
      });

      doc.rect(340, rowY + 5, 215, 30).fill(primaryColor);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#fff').text('TOTAL DUE', 350, rowY + 14);
      doc.fontSize(13).text(`₹${(bill.totalInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 460, rowY + 12, { width: 80, align: 'right' });

      // --- 4b. EARLY BIRD INCENTIVE BLOCK ---
      if (bill.earlyBird && bill.earlyBird.discountPercent > 0 && bill.status === 'UNPAID') {
        rowY += 45;
        doc.rect(40, rowY, 515, 45).fill('#F0FDF4'); // Light green background
        doc.rect(40, rowY, 4, 45).fill('#10B981'); // Success border left
        
        const ebDate = new Date(bill.earlyBird.eligibleUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const discountedTotal = (bill.totalInPaise - bill.earlyBird.discountAmountInPaise) / 100;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#065F46').text(' ✨  Early-Bird Special Incentive', 55, rowY + 10);
        doc.fontSize(9).font('Helvetica').fillColor('#047857').text(`Pay by ${ebDate} and save ₹${(bill.earlyBird.discountAmountInPaise / 100).toFixed(2)} (${bill.earlyBird.discountPercent}%).`, 55, rowY + 25);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#065F46').text(`Amount Payable: ₹${discountedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 400, rowY + 18, { width: 140, align: 'right' });
      }

      // --- 5. FOOTER (Signature & Info) ---
      const footerTop = 720;
      doc.moveTo(40, footerTop).lineTo(555, footerTop).stroke('#eee');
      
      // Auth Signature
      const sigAbsPath = getAbsPath(org.signatureUrl);
      if (sigAbsPath) {
        try { doc.image(sigAbsPath, 420, footerTop + 10, { width: 80 }); } catch (e) {}
      }
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#444').text('Authorized Signatory', 420, footerTop + 55);
      
      // Footer Branding
      doc.fontSize(8).font('Helvetica').fillColor('#999')
         .text(org.footerText || `This is a computer-generated bill by ${org.name}. No physical signature required.`, 
          40, footerTop + 20, { width: 300 });

      res.on('finish', resolve);
      doc.end();
    } catch (e) {
      console.error('PDF Generation Crash:', e);
      doc.end();
      reject(e);
    }
  });
};

function renderInitialLogo(doc, org) {
  const initial = org.name ? org.name.charAt(0).toUpperCase() : 'E';
  const color = org.primaryColor || '#7C3AED';
  doc.circle(62, 65, 22).fill(color);
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#fff').text(initial, 54, 55);
}