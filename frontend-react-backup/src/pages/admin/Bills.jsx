import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { billService, userService } from '../../services/index.js';

const formatAmount = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const now = new Date();

export default function AdminBills() {
  const [bills, setBills] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    userId: '',
    previousReading: '',
    currentReading: '',
    billingPeriod: { month: now.getMonth() + 1, year: now.getFullYear() },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: billData }, { data: userData }] = await Promise.all([
        billService.listAll({ status: filterStatus }),
        userService.list({ limit: 200 }),
      ]);
      setBills(billData.bills || []);
      setConsumers(userData.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await billService.generate(form.userId, {
        previousReading: Number(form.previousReading),
        currentReading: Number(form.currentReading),
        billingPeriod: form.billingPeriod,
      });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate bill');
    } finally { setSaving(false); }
  };

  const handleExport = async () => {
    try {
      const { data } = await billService.exportCsv();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `energi-bills-${Date.now()}.csv`;
      a.click();
    } catch (err) { alert('Export failed'); }
  };

  return (
    <AppLayout>
      <div className="page-header flex-between">
        <div>
          <h1>Bills</h1>
          <p>Generate and manage electricity bills</p>
        </div>
        <div className="flex gap-2">
          <select id="statusFilter" className="form-input" style={{ width: 'auto' }} value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="DISPUTED">Disputed</option>
            <option value="WAIVED">Waived</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExport}>⬇ Export CSV</button>
          <button id="generateBillBtn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Generate Bill</button>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🧾</div>
          <h3>No bills found</h3>
          <p>Generate bills by entering meter readings</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Consumer</th>
                  <th>Period</th>
                  <th>Units</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.userId?.name || '—'}</div>
                      <div className="text-muted">{b.userId?.consumerId}</div>
                    </td>
                    <td>{b.billingPeriod?.month}/{b.billingPeriod?.year}</td>
                    <td>{b.unitsConsumed} kWh</td>
                    <td><span className="amount">{formatAmount(b.totalInPaise)}</span></td>
                    <td className="text-muted">{new Date(b.dueDate).toLocaleDateString('en-IN')}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <a href={billService.pdfUrl(b._id)} target="_blank" rel="noreferrer"
                        className="btn btn-secondary btn-sm">📄 PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Generate Bill</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">Select Consumer</label>
                <select id="billConsumer" className="form-select" value={form.userId}
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
                  <option value="">Choose consumer...</option>
                  {consumers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.consumerId})</option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select className="form-select"
                    value={form.billingPeriod.month}
                    onChange={e => setForm(f => ({ ...f, billingPeriod: { ...f.billingPeriod, month: Number(e.target.value) } }))}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-IN', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" value={form.billingPeriod.year}
                    onChange={e => setForm(f => ({ ...f, billingPeriod: { ...f.billingPeriod, year: Number(e.target.value) } }))} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Previous Reading (kWh)</label>
                  <input id="prevReading" type="number" className="form-input" placeholder="e.g. 1200"
                    value={form.previousReading} onChange={e => setForm(f => ({ ...f, previousReading: e.target.value }))} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Reading (kWh)</label>
                  <input id="currReading" type="number" className="form-input" placeholder="e.g. 1350"
                    value={form.currentReading} onChange={e => setForm(f => ({ ...f, currentReading: e.target.value }))} required min="0" />
                </div>
              </div>
              {form.previousReading && form.currentReading && Number(form.currentReading) >= Number(form.previousReading) && (
                <div className="alert alert-success">
                  Units consumed: <strong>{Number(form.currentReading) - Number(form.previousReading)} kWh</strong>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="saveBillBtn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
