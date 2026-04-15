import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    orgName: '', orgSlug: '', contactEmail: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="mark">E</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>EnergI</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>New Organization Setup</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 99,
              background: step >= s ? 'var(--color-primary)' : 'var(--color-border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <h1>{step === 1 ? 'Your Organization' : 'Admin Account'}</h1>
        <p className="subtitle">{step === 1 ? 'Tell us about your housing society or utility provider' : 'Create your admin login credentials'}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input
                  id="orgName"
                  className="form-input"
                  placeholder="e.g. Green Valley CHS"
                  value={form.orgName}
                  onChange={e => { update('orgName', e.target.value); update('orgSlug', autoSlug(e.target.value)); }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input
                  id="orgSlug"
                  className="form-input"
                  placeholder="green-valley-chs"
                  value={form.orgSlug}
                  onChange={e => update('orgSlug', autoSlug(e.target.value))}
                  required
                />
                <p className="text-xs text-muted mt-1">Used for login: energi.app/login?org={form.orgSlug || 'your-slug'}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input id="contactEmail" type="email" className="form-input" placeholder="admin@society.com"
                  value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} required />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input id="adminName" className="form-input" placeholder="Full name"
                  value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="adminEmail" type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="adminPassword" type="password" className="form-input" placeholder="Min 8 characters"
                  value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} />
              </div>
            </>
          )}

          <div className="flex gap-2">
            {step === 2 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                ← Back
              </button>
            )}
            <button id="nextBtn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {step === 1 ? 'Continue →' : (loading ? 'Creating...' : 'Create Account →')}
            </button>
          </div>
        </form>

        <p className="text-muted mt-4" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
