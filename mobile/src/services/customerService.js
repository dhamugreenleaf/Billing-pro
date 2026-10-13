import api from './api';

export const customerService = {
  /**
   * Get all customers for the company
   */
  async getCustomers() {
    const response = await api.get('/customers');
    return response.data;
  },

  /**
   * Create or find customer
   */
  async createCustomer(customerData) {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  /**
   * Search customer by mobile number
   */
  async getCustomerByMobile(mobile) {
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    const response = await api.get(`/customers/mobile/${cleanMobile}`);
    return response.data;
  },
};

export default customerService;
