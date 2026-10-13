import api from './api';

export const reportsService = {
  /**
   * Get dashboard metrics and reports statistics
   */
  async getDashboardStats(params = {}) {
    const query = new URLSearchParams();
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.customerName) query.append('customerName', params.customerName);
    if (params.customerMobile) query.append('customerMobile', params.customerMobile);

    const queryString = query.toString();
    const endpoint = queryString ? `/reports/dashboard?${queryString}` : '/reports/dashboard';
    const response = await api.get(endpoint);
    return response.data;
  },
};

export default reportsService;
