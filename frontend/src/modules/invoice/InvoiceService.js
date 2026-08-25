import api from '../../utils/api';

export const InvoiceService = {
  generateInvoice: async (invoiceData) => {
    return await api.post('/invoices', invoiceData);
  },
  
  getInvoices: async () => {
    return await api.get('/invoices');
  },
  
  getInvoiceById: async (id) => {
    return await api.get(`/invoices/${id}`);
  },
  
  updateInvoiceTemplate: async (id, template) => {
    return await api.patch(`/invoices/${id}/template`, { template });
  },
  
  deleteInvoice: async (id) => {
    return await api.delete(`/invoices/${id}`);
  },

  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(amount) || 0);
  },

  formatDate: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};
