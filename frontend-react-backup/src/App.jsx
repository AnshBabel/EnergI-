import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Auth
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Admin
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminTariff from './pages/admin/Tariff.jsx';
import AdminBills from './pages/admin/Bills.jsx';
import AdminDisputes from './pages/admin/Disputes.jsx';

// Consumer
import ConsumerDashboard from './pages/consumer/Dashboard.jsx';
import ConsumerBills from './pages/consumer/Bills.jsx';
import ConsumerDisputes from './pages/consumer/Disputes.jsx';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/consumer/dashboard'} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/tariff" element={<ProtectedRoute role="ADMIN"><AdminTariff /></ProtectedRoute>} />
        <Route path="/admin/bills" element={<ProtectedRoute role="ADMIN"><AdminBills /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute role="ADMIN"><AdminDisputes /></ProtectedRoute>} />

        {/* Consumer routes */}
        <Route path="/consumer/dashboard" element={<ProtectedRoute role="CONSUMER"><ConsumerDashboard /></ProtectedRoute>} />
        <Route path="/consumer/bills" element={<ProtectedRoute role="CONSUMER"><ConsumerBills /></ProtectedRoute>} />
        <Route path="/consumer/disputes" element={<ProtectedRoute role="CONSUMER"><ConsumerDisputes /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
