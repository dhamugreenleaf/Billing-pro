import api from './api';

export const authService = {
  /**
   * Verify login OTP verification code and receive JWT session
   */
  async verifyMsg91(identifier, accessToken, name = '', loginType = 'user') {
    const response = await api.post('/auth/verify-msg91', {
      identifier,
      accessToken,
      name,
      loginType,
    }, { skipAuth: true });
    return response.data;
  },

  /**
   * Dispatch / Resend login OTP via server endpoint
   */
  async resendOtp(identifier) {
    const response = await api.post('/auth/resend-otp', {
      identifier,
    }, { skipAuth: true });
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Accept user terms and conditions
   */
  async acceptTerms() {
    const response = await api.post('/auth/accept-terms', {});
    return response.data;
  },
};

export default authService;
