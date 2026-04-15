import api from './api.js';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const orgService = {
  getBranding: () => api.get('/org/branding'),
  updateBranding: (data) => api.patch('/org/branding', data),
};

export const tariffService = {
  list: () => api.get('/tariffs'),
  create: (data) => api.post('/tariffs', data),
  activate: (id) => api.patch(`/tariffs/${id}/activate`),
  delete: (id) => api.delete(`/tariffs/${id}`),
};

export const userService = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
};

export const billService = {
  listMy: (params) => api.get('/bills/my', { params }),
  listAll: (params) => api.get('/bills', { params }),
  listByUser: (userId, params) => api.get(`/bills/user/${userId}`, { params }),
  generate: (userId, data) => api.post(`/bills/user/${userId}`, data),
  getOne: (id) => api.get(`/bills/${id}`),
  analytics: () => api.get('/bills/analytics'),
  pdfUrl: (id) => `/api/v1/bills/${id}/pdf`,
  exportCsv: () => api.get('/bills/export', { responseType: 'blob' }),
};

export const paymentService = {
  checkout: (billId) => api.post(`/payments/checkout/${billId}`),
};

export const disputeService = {
  raise: (billId, reason) => api.post(`/disputes/bill/${billId}`, { reason }),
  listMy: () => api.get('/disputes/my'),
  listAll: (params) => api.get('/disputes', { params }),
  resolve: (id, data) => api.patch(`/disputes/${id}/resolve`, data),
  updateStatus: (id, status) => api.patch(`/disputes/${id}/status`, { status }),
};
