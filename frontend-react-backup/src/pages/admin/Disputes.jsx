import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { disputeService } from '../../services/index.js';

const formatAmount = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resolveForm, setResolveForm] = useState({ resolution: 'RESOLVED', adminNote: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await disputeService.listAll();
      setDisputes(data.disputes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await disputeService.resolve(selected._id, resolveForm);
      setSelected(null);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSetUnderReview = async (id) => {
    try {
      await disputeService.updateStatus(id, 'UNDER_REVIEW');
      load();
    } catch (err) { alert('Failed'); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Disputes</h1>
        <p>Review and resolve consumer bill disputes</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>No disputes</h3>
          <p>All clear — no open disputes at this time</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Consumer</th>
                  <th>Bill Period</th>
                  <th>Bill Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.userId?.name}</div>
                      <div className="text-muted">{d.userId?.consumerId}</div>
                    </td>
                    <td>{d.billId?.billingPeriod?.month}/{d.billId?.billingPeriod?.year}</td>
                    <td>{d.billId ? formatAmount(d.billId.totalInPaise) : '—'}</td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {d.reason}
                      </span>
                    </td>
                    <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        {d.status === 'OPEN' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSetUnderReview(d._id)}>
                            Review
                          </button>
                        )}
                        {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                          <button id={`resolveBtn-${d._id}`} className="btn btn-primary btn-sm" onClick={() => setSelected(d)}>
                            Resolve
                          </button>
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

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Resolve Dispute</h2>
            <p className="text-muted mb-4">Consumer: {selected.userId?.name}<br />Reason: {selected.reason}</p>
            <form onSubmit={handleResolve}>
              <div className="form-group">
                <label className="form-label">Resolution</label>
                <select id="resolutionSelect" className="form-select" value={resolveForm.resolution}
                  onChange={e => setResolveForm(f => ({ ...f, resolution: e.target.value }))}>
                  <option value="RESOLVED">Resolved — Waive the bill</option>
                  <option value="REJECTED">Rejected — Bill stands</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Note (visible to consumer)</label>
                <textarea className="form-input" style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Explain the resolution..."
                  value={resolveForm.adminNote}
                  onChange={e => setResolveForm(f => ({ ...f, adminNote: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button id="confirmResolveBtn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
