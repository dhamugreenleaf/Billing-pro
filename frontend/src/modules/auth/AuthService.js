import api from '../../utils/api';

export const AuthService = {
  sendOtp: async (identifier) => {
    return await api.post('/auth/send-otp', { identifier });
  },
  verifyMsg91Token: async (identifier, accessToken, loginType = 'user') => {
    return await api.post('/auth/verify-msg91', { identifier, accessToken, loginType });
  },
  resendOtp: async (identifier) => {
    return await api.post('/auth/resend-otp', { identifier });
  },
  testLogin: async (username, password) => {
    if (import.meta.env.PROD) {
      throw new Error('Test login is disabled in production builds');
    }
    return await api.post('/auth/test-login', { username, password });
  },
  checkAdmin: async (identifier) => {
    return await api.post('/auth/check-admin', { identifier });
  }
};
