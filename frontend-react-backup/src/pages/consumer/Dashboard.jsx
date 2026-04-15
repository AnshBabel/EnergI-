import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { billService, paymentService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

const formatAmount = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    billService.listMy({ limit: 3 })
      .then(({ data }) => setBills(data.bills || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latestBill = bills[0];
  const isOverdue = latestBill && latestBill.status === 'UNPAID' && new Date(latestBill.dueDate) < new Date();

  const handlePay = async (billId) => {
    setPaying(billId);
    try {
      const { data } = await paymentService.checkout(billId);
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed to initialize');
      setPaying(null);
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Consumer ID: <strong>{user?.consumerId}</strong> · Meter: <strong>{user?.meterNumber || 'Not assigned'}</strong></p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Current Bill Hero Card */}
          {latestBill ? (
            <div className="card mb-6" style={{
              background: isOverdue
                ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
                : 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.05))',
              borderColor: isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)',
            }}>
              <div className="flex-between">
                <div>
                  <div className="text-muted text-sm">Current Bill — {latestBill.billingPeriod?.month}/{latestBill.billingPeriod?.year}</div>
                  <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, color: isOverdue ? 'var(--color-danger)' : 'var(--color-primary-light)', lineHeight: 1.1, margin: '8px 0' }}>
                    {formatAmount(latestBill.totalInPaise)}
                  </div>
                  <div className="text-muted">{latestBill.unitsConsumed} kWh consumed</div>
                  <div className="mt-2">
                    <span className={`badge badge-${latestBill.status}`}>{latestBill.status}</span>
                    {isOverdue && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginLeft: 8 }}>⚠️ Overdue since {new Date(latestBill.dueDate).toLocaleDateString('en-IN')}</span>}
                    {!isOverdue && latestBill.status === 'UNPAID' && <span className="text-muted text-sm" style={{ marginLeft: 8 }}>Due {new Date(latestBill.dueDate).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  {latestBill.status === 'UNPAID' && (
                    <button id="payNowBtn" className="btn btn-primary btn-lg" onClick={() => handlePay(latestBill._id)} disabled={paying === latestBill._id}>
                      {paying === latestBill._id ? 'Redirecting...' : '💳 Pay Now'}
                    </button>
                  )}
                  <a href={billService.pdfUrl(latestBill._id)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    📄 Download PDF
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-6 empty-state">
              <div className="icon">🎉</div>
              <h3>No bills yet</h3>
              <p>Your bills will appear here once generated</p>
            </div>
          )}

          {/* Recent Bills */}
          {bills.length > 0 && (
            <div className="card">
              <div className="flex-between mb-4">
                <h3 style={{ fontWeight: 600 }}>Recent Bills</h3>
                <a href="/consumer/bills" className="btn btn-secondary btn-sm">View All</a>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Units</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(b => (
                      <tr key={b._id}>
                        <td>{b.billingPeriod?.month}/{b.billingPeriod?.year}</td>
                        <td>{b.unitsConsumed} kWh</td>
                        <td><span className="amount">{formatAmount(b.totalInPaise)}</span></td>
                        <td className="text-muted">{new Date(b.dueDate).toLocaleDateString('en-IN')}</td>
                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                        <td>
                          {b.status === 'UNPAID' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handlePay(b._id)} disabled={paying === b._id}>
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
