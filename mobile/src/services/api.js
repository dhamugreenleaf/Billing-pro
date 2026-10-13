import { ENV } from '../config/env';
import { Storage } from './storage';

// Subscriber callback for 401 unauthorized session expiry
let onUnauthorizedCallback = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorizedCallback = handler;
};

/**
 * Core HTTP client using native Fetch API
 */
export const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = ENV.TIMEOUT_MS,
    skipAuth = false,
  } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${ENV.API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  // Attach Bearer JWT token if available and not skipped
  if (!skipAuth) {
    const token = await Storage.getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const fetchConfig = {
    method,
    headers: requestHeaders,
    signal: controller.signal,
  };

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchConfig);
    clearTimeout(timer);

    // Handle 401 Unauthorized session expiry
    if (response.status === 401) {
      if (!skipAuth) {
        await Storage.clearSession();
        if (typeof onUnauthorizedCallback === 'function') {
          onUnauthorizedCallback();
        }
      }
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text || response.statusText };
    }

    if (!response.ok) {
      const errorMsg =
        responseData?.message ||
        responseData?.error ||
        (Array.isArray(responseData?.errors) && responseData.errors[0]?.message) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMsg);
      error.status = response.status;
      error.errors = responseData?.errors || [];
      error.raw = responseData;
      throw error;
    }

    return responseData;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Connection timed out. Please check your internet connection.');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
