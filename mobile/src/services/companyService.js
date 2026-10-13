import api from './api';

export const companyService = {
  /**
   * Get user company profile
   */
  async getProfile() {
    const response = await api.get('/company');
    return response.data;
  },

  /**
   * Setup or update company profile
   */
  async setupCompany(companyData) {
    const response = await api.post('/company', companyData);
    return response.data;
  },
};

export default companyService;
