import api from './api';

export const invoiceService = {
  /**
   * Get list of invoices for the company
   */
  async getInvoices() {
    const response = await api.get('/invoices');
    return response.data;
  },

  /**
   * Get single invoice details by ID
   */
  async getInvoice(id) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData) {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  /**
   * Delete an invoice by ID
   */
  async deleteInvoice(id) {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Record a payment against an invoice
   */
  async recordPayment(id, paymentData) {
    const response = await api.post(`/invoices/${id}/payment`, paymentData);
    return response.data;
  },

  /**
   * Get payment history for an invoice
   */
  async getPayments(id) {
    const response = await api.get(`/invoices/${id}/payments`);
    return response.data;
  },
};

export default invoiceService;
