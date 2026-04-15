import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.jsx';
import { tariffService } from '../../services/index.js';

const formatPaise = (p) => `₹${(p / 100).toFixed(2)}`;

export default function AdminTariff() {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    fixedChargeInPaise: 0,
    taxPercent: 0,
    slabs: [{ upToUnits: 100, rateInPaise: 500 }, { upToUnits: null, rateInPaise: 800 }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await tariffService.list();
      setTariffs(data.tariffs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addSlab = () => setForm(f => ({ ...f, slabs: [...f.slabs, { upToUnits: null, rateInPaise: 0 }] }));
  const removeSlab = (i) => setForm(f => ({ ...f, slabs: f.slabs.filter((_, idx) => idx !== i) }));
  const updateSlab = (i, key, val) => setForm(f => ({
    ...f,
    slabs: f.slabs.map((s, idx) => idx === i ? { ...s, [key]: val === '' ? null : Number(val) } : s),
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await tariffService.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save tariff');
    } finally { setSaving(false); }
  };

  const handleActivate = async (id) => {
    try {
      await tariffService.activate(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate');
    }
  };

  return (
    <AppLayout>
      <div className="page-header flex-between">
        <div>
          <h1>Tariff Configuration</h1>
          <p>Manage dynamic slab-rate pricing</p>
        </div>
        <button id="addTariffBtn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Tariff</button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : tariffs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⚡</div>
          <h3>No tariff configured</h3>
          <p>Create your first tariff to start generating bills</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tariffs.map(t => (
            <div key={t._id} className="card" style={{ borderColor: t.isActive ? 'rgba(124,58,237,0.4)' : undefined }}>
              <div className="flex-between mb-4">
                <div>
                  <h3 style={{ fontWeight: 600 }}>{t.name}
                    {t.isActive && <span className="badge badge-PAID" style={{ marginLeft: 8 }}>Active</span>}
                  </h3>
                  <p className="text-muted">Effective from {new Date(t.effectiveFrom).toLocaleDateString('en-IN')} · Tax: {t.taxPercent}% · Fixed: {formatPaise(t.fixedChargeInPaise)}</p>
                </div>
                {!t.isActive && (
                  <button className="btn btn-success btn-sm" onClick={() => handleActivate(t._id)}>Set Active</button>
                )}
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Slab</th><th>Up To Units</th><th>Rate / Unit</th></tr></thead>
                  <tbody>
                    {t.slabs.map((s, i) => (
                      <tr key={i}>
                        <td>Slab {i + 1}</td>
                        <td>{s.upToUnits ? `≤ ${s.upToUnits} units` : 'Unlimited'}</td>
                        <td>{formatPaise(s.rateInPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h2>New Tariff Config</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tariff Name</label>
                  <input id="tariffName" className="form-input" placeholder="FY 2025-26" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Effective From</label>
                  <input type="date" className="form-input" value={form.effectiveFrom}
                    onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fixed Charge (₹)</label>
                  <input type="number" className="form-input" placeholder="0" step="0.01"
                    value={form.fixedChargeInPaise / 100}
                    onChange={e => setForm(f => ({ ...f, fixedChargeInPaise: Math.round(parseFloat(e.target.value || 0) * 100) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax %</label>
                  <input type="number" className="form-input" placeholder="0" step="0.01"
                    value={form.taxPercent}
                    onChange={e => setForm(f => ({ ...f, taxPercent: parseFloat(e.target.value || 0) }))} />
                </div>
              </div>

              <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Slabs</h3>
              {form.slabs.map((slab, i) => (
                <div key={i} className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input className="form-input" type="number" placeholder="Up to units (blank = unlimited)"
                      value={slab.upToUnits ?? ''} onChange={e => updateSlab(i, 'upToUnits', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input className="form-input" type="number" placeholder="Rate in ₹/unit" step="0.01"
                      value={slab.rateInPaise / 100}
                      onChange={e => updateSlab(i, 'rateInPaise', Math.round(parseFloat(e.target.value || 0) * 100))} />
                  </div>
                  {form.slabs.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSlab(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm mt-1" onClick={addSlab}>+ Add Slab</button>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="saveTariffBtn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
