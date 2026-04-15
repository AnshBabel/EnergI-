import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { disputeService } from '../../services/index.js';

const formatAmount = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ConsumerDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disputeService.listMy()
      .then(({ data }) => setDisputes(data.disputes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <h1>My Disputes</h1>
        <p>Track your bill dispute requests</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>No disputes raised</h3>
          <p>You can raise disputes from the Bills page</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputes.map(d => (
            <div key={d._id} className="card">
              <div className="flex-between mb-2">
                <div>
                  <span style={{ fontWeight: 600 }}>
                    Bill: {d.billId?.billingPeriod?.month}/{d.billId?.billingPeriod?.year}
                  </span>
                  {d.billId && <span className="text-muted" style={{ marginLeft: 8 }}>({formatAmount(d.billId.totalInPaise)})</span>}
                </div>
                <span className={`badge badge-${d.status}`}>{d.status}</span>
              </div>
              <p className="text-muted text-sm"><strong>Your reason:</strong> {d.reason}</p>
              {d.adminNote && (
                <p className="text-sm mt-2" style={{ padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 6 }}>
                  <strong>Admin response:</strong> {d.adminNote}
                </p>
              )}
              <p className="text-xs text-muted mt-2">Raised on {new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
