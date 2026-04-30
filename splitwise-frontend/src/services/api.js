import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
};

export const groupsAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  addMember: (id, userId) => api.post(`/groups/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}`),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const expensesAPI = {
  create: (data) => {
    const idempotencyKey = uuidv4();
    return api.post('/expenses', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  },
  getAll: (params) => api.get('/expenses', { params }),
  getByGroup: (groupId, params) => api.get('/expenses', { params: { ...params, groupId } }),
  getById: (id) => api.get(`/expenses/${id}`),
  getHistory: (id) => api.get(`/expenses/${id}/history`),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const balancesAPI = {
  getGlobal: () => api.get('/balances'),
  getByGroup: (groupId) => api.get(`/balances/group/${groupId}`),
};

export const settlementsAPI = {
  pay: (data) => api.post('/settlements/pay', data),
  getAll: (params) => api.get('/settlements', { params }),
  getByGroup: (id, params) => api.get(`/settlements/group/${id}`, { params }),
  getOptimized: (id) => api.get(`/settlements/optimize/group/${id}`),
};

export const activityAPI = {
  getMine: (params) => api.get('/activity', { params }),
  getByGroup: (id, params) => api.get(`/activity/group/${id}`, { params }),
};

export default api;
