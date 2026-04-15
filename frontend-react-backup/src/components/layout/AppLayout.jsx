import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const AdminNav = () => (
  <nav className="sidebar-nav">
    <p className="nav-section-label">Overview</p>
    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">📊</span> Dashboard
    </NavLink>
    <p className="nav-section-label">Management</p>
    <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">👥</span> Consumers
    </NavLink>
    <NavLink to="/admin/tariff" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">⚡</span> Tariff Config
    </NavLink>
    <NavLink to="/admin/bills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">🧾</span> Bills
    </NavLink>
    <NavLink to="/admin/disputes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">⚠️</span> Disputes
    </NavLink>
  </nav>
);

const ConsumerNav = () => (
  <nav className="sidebar-nav">
    <p className="nav-section-label">My Account</p>
    <NavLink to="/consumer/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">🏠</span> Dashboard
    </NavLink>
    <NavLink to="/consumer/bills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">🧾</span> My Bills
    </NavLink>
    <NavLink to="/consumer/disputes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">📋</span> Disputes
    </NavLink>
  </nav>
);

export const AppLayout = ({ children }) => {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">E</div>
          <span className="logo-text">{org?.name || 'EnergI'}</span>
        </div>

        {user?.role === 'ADMIN' ? <AdminNav /> : <ConsumerNav />}

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--color-surface-2)', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{user?.role} · {user?.consumerId}</div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--color-danger)', width: '100%' }}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
