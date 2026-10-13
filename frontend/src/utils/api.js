import axios from 'axios';

const isProd = import.meta.env.PROD;
let baseURL = 'http://localhost:5000/api';
if (isProd) {
  if (window.location.hostname.includes('gobill.greenleafagencies.com')) {
    baseURL = 'https://gobill.greenleafagencies.com/api';
  } else {
    baseURL = 'https://gobill.gldatacenter.com/api';
  }
}

const api = axios.create({
  baseURL: baseURL,
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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = ['/login', '/admin-login', '/terms', '/privacy', '/gst-billing', '/retail-billing', '/invoice-formats'];
      if (import.meta.env.DEV) {
        publicPaths.push('/test-login');
      }
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Return a standardized error format
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const errors = error.response?.data?.errors || [];
    return Promise.reject({ message, errors, status: error.response?.status });
  }
);

export default api;
