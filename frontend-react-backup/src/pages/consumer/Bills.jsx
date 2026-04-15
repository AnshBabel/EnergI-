import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { billService, paymentService, disputeService } from '../../services/index.js';

const formatAmount = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ConsumerBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSaving, setDisputeSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await billService.listMy();
      setBills(data.bills || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (billId) => {
    setPaying(billId);
    try {
      const { data } = await paymentService.checkout(billId);
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
      setPaying(null);
    }
  };

  const handleDispute = async (e) => {
    e.preventDefault();
    setDisputeSaving(true);
    try {
      await disputeService.raise(disputeModal._id, disputeReason);
      setDisputeModal(null);
      setDisputeReason('');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to raise dispute');
    } finally { setDisputeSaving(false); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>My Bills</h1>
        <p>Complete billing history</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📄</div>
          <h3>No bills yet</h3>
          <p>Your bill history will appear here</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Units Consumed</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 500 }}>{b.billingPeriod?.month}/{b.billingPeriod?.year}</td>
                    <td>{b.unitsConsumed} kWh</td>
                    <td><span className="amount">{formatAmount(b.totalInPaise)}</span></td>
                    <td className="text-muted">{new Date(b.dueDate).toLocaleDateString('en-IN')}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <a href={billService.pdfUrl(b._id)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄</a>
                        {b.status === 'UNPAID' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handlePay(b._id)} disabled={paying === b._id}>
                              {paying === b._id ? '...' : 'Pay'}
                            </button>
                            <button id={`disputeBtn-${b._id}`} className="btn btn-danger btn-sm" onClick={() => setDisputeModal(b)}>
                              Dispute
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {disputeModal && (
        <div className="modal-overlay" onClick={() => setDisputeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Raise Dispute</h2>
            <p className="text-muted mb-4">
              Bill for {disputeModal.billingPeriod?.month}/{disputeModal.billingPeriod?.year} — {formatAmount(disputeModal.totalInPaise)}
            </p>
            <form onSubmit={handleDispute}>
              <div className="form-group">
                <label className="form-label">Reason for dispute</label>
                <textarea id="disputeReason" className="form-input" style={{ minHeight: 100, resize: 'vertical' }}
                  placeholder="Describe the issue with this bill..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  required minLength={20} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDisputeModal(null)}>Cancel</button>
                <button id="submitDisputeBtn" type="submit" className="btn btn-danger" disabled={disputeSaving}>
                  {disputeSaving ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
