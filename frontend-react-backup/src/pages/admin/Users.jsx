import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { userService } from '../../services/index.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', meterNumber: '', address: '', phone: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await userService.list();
      setUsers(data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await userService.create(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', meterNumber: '', address: '', phone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create consumer');
    } finally { setSaving(false); }
  };

  return (
    <AppLayout>
      <div className="page-header flex-between">
        <div>
          <h1>Consumers</h1>
          <p>Manage your electricity consumers</p>
        </div>
        <button id="addConsumerBtn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Consumer
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👤</div>
          <h3>No consumers yet</h3>
          <p>Add your first consumer to get started</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Consumer</th>
                  <th>Consumer ID</th>
                  <th>Meter No.</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div className="text-muted">{u.email}</div>
                    </td>
                    <td><code style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{u.consumerId}</code></td>
                    <td className="text-muted">{u.meterNumber || '—'}</td>
                    <td className="text-muted">{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-PAID' : 'badge-WAIVED'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
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
            <h2>Add New Consumer</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input id="consumerName" className="form-input" placeholder="Consumer name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Meter Number</label>
                  <input id="meterNumber" className="form-input" placeholder="M-001" value={form.meterNumber}
                    onChange={e => setForm(f => ({ ...f, meterNumber: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="consumerEmail" type="email" className="form-input" placeholder="consumer@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input id="consumerPassword" type="password" className="form-input" placeholder="Min 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input id="consumerPhone" className="form-input" placeholder="+91 9999999999" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input id="consumerAddress" className="form-input" placeholder="Flat / Block" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="saveConsumerBtn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Consumer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
