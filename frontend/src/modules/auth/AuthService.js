import api from '../../utils/api';

export const AuthService = {
  verifyMsg91Token: async (identifier, accessToken) => {
    return await api.post('/auth/verify-msg91', { identifier, accessToken });
  },
  resendOtp: async (identifier) => {
    return await api.post('/auth/resend-otp', { identifier });
  },
  testLogin: async (username, password) => {
    return await api.post('/auth/test-login', { username, password });
  }
};
