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
    // Return a standardized error format
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const errors = error.response?.data?.errors || [];
    return Promise.reject({ message, errors, status: error.response?.status });
  }
);

export default api;
