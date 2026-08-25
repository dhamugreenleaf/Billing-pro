import * as reportsRepo from '../repository/reports.repository.js';
import * as companyService from '../../company/services/company.service.js';

export const getDashboardStats = async (user_id, fromDateStr, toDateStr, customerName, customerMobile) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) throw { statusCode: 400, message: 'Company profile required' };

  const stats = await reportsRepo.getDashboardStats(company.id, fromDateStr, toDateStr, customerName, customerMobile);
  return { ...stats, company };
};
