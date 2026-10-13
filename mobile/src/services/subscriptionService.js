import api from './api';

export const subscriptionService = {
  /**
   * Get current active subscription for user
   */
  async getCurrentSubscription() {
    const response = await api.get('/subscription/current');
    return response.data;
  },

  /**
   * Get available subscription plans
   */
  async getPlans() {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  /**
   * Activate plan for testing
   */
  async activateTestPro(planName = 'Pro') {
    const response = await api.post('/subscription/activate-test-pro', { planName });
    return response.data;
  },
};

export default subscriptionService;
