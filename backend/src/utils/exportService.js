import { Parser } from 'json2csv';
import { formatPaise } from './billingEngine.js';

/**
 * Converts an array of bill documents to CSV and sends as download.
 */
export const exportBillsCsv = (bills, res) => {
  const fields = [
    { label: 'Bill ID', value: '_id' },
    { label: 'Consumer Name', value: (row) => row.userId?.name || '' },
    { label: 'Consumer ID', value: (row) => row.userId?.consumerId || '' },
    { label: 'Month', value: (row) => row.billingPeriod?.month },
    { label: 'Year', value: (row) => row.billingPeriod?.year },
    { label: 'Units Consumed', value: 'unitsConsumed' },
    { label: 'Total (INR)', value: (row) => (row.totalInPaise / 100).toFixed(2) },
    { label: 'Status', value: 'status' },
    { label: 'Due Date', value: (row) => new Date(row.dueDate).toLocaleDateString('en-IN') },
    { label: 'Bill Date', value: (row) => new Date(row.billDate).toLocaleDateString('en-IN') },
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(bills);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="bills-export-${Date.now()}.csv"`);
  res.send(csv);
};
