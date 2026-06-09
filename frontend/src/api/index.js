import axios from 'axios';

const API_BASE_URL = 'http://localhost:8063/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (username, password) => {
  return api.post('/login', { username, password });
};

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);

export const getRoughStones = () => api.get('/rough-stones');
export const createRoughStone = (data) => api.post('/rough-stones', data);

export const getCustomers = () => api.get('/customers');
export const createCustomer = (data) => api.post('/customers', data);

export const getSandpaper = () => api.get('/sandpaper');

export const getPolishingPaste = () => api.get('/polishing-paste');
export const updatePolishingPaste = (id, data) => api.put(`/polishing-paste/${id}`, data);

export const getWorkOrders = () => api.get('/work-orders');
export const getWorkOrder = (id) => api.get(`/work-orders/${id}`);
export const createWorkOrder = (data) => api.post('/work-orders', data);
export const advanceStage = (id, data) => api.post(`/work-orders/${id}/advance-stage`, data);
export const reworkOrder = (id, data) => api.post(`/work-orders/${id}/rework`, data);

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getAlerts = () => api.get('/alerts');

export default api;
