import { createContext, useContext, useState, useEffect } from 'react';
import { authService, orgService } from '../services/index.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      try {
        const [{ data: meData }, { data: brandData }] = await Promise.all([
          authService.me(),
          orgService.getBranding(),
        ]);
        setUser(meData.user);
        setOrg(brandData.org);
        applyBranding(brandData.org);
      } catch {
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const applyBranding = (orgData) => {
    if (orgData?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', orgData.primaryColor);
    }
  };

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setOrg(data.org);
    applyBranding(data.org);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authService.register(formData);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setOrg(data.org);
    applyBranding(data.org);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
    setOrg(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
