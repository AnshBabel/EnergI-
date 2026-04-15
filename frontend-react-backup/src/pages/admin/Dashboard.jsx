import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { billService } from '../../services/index.js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatAmount = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: analyticsData }, { data: billsData }] = await Promise.all([
          billService.analytics(),
          billService.listAll({ limit: 5 }),
        ]);
        setAnalytics(analyticsData);
        setRecentBills(billsData.bills || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Dummy chart data for visualization
  const chartData = [
    { month: 'Nov', collected: 420000, pending: 80000 },
    { month: 'Dec', collected: 380000, pending: 120000 },
    { month: 'Jan', collected: 510000, pending: 60000 },
    { month: 'Feb', collected: 460000, pending: 90000 },
    { month: 'Mar', collected: 530000, pending: 45000 },
    { month: 'Apr', collected: analytics?.totalCollectedInPaise || 0, pending: analytics?.totalPendingInPaise || 0 },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your billing operations</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <div className="stat-label">Total Collected</div>
              <div className="stat-value">{formatAmount(analytics?.totalCollectedInPaise || 0)}</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
                {formatAmount(analytics?.totalPendingInPaise || 0)}
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🔴</span>
              <div className="stat-label">Overdue</div>
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
                {formatAmount(analytics?.totalOverdueInPaise || 0)}
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📄</span>
              <div className="stat-label">Total Bills</div>
              <div className="stat-value">{analytics?.billCount || 0}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card mb-6">
            <h3 style={{ marginBottom: 24, fontWeight: 600 }}>Collections Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => formatAmount(v)}
                />
                <Area type="monotone" dataKey="collected" stroke="#7C3AED" fill="url(#collected)" strokeWidth={2} name="Collected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Bills */}
          <div className="card">
            <div className="flex-between mb-4">
              <h3 style={{ fontWeight: 600 }}>Recent Bills</h3>
              <a href="/admin/bills" className="btn btn-secondary btn-sm">View All</a>
            </div>
            {recentBills.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🧾</div>
                <h3>No bills yet</h3>
                <p>Generate your first bill from the Bills section</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Consumer</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBills.map(bill => (
                      <tr key={bill._id}>
                        <td>{bill.userId?.name || '—'}<br /><span className="text-muted">{bill.userId?.consumerId}</span></td>
                        <td>{bill.billingPeriod?.month}/{bill.billingPeriod?.year}</td>
                        <td><span className="amount">{formatAmount(bill.totalInPaise)}</span></td>
                        <td className="text-muted">{new Date(bill.dueDate).toLocaleDateString('en-IN')}</td>
                        <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
