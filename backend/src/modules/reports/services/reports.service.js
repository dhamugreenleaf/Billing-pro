import * as reportsRepo from '../repository/reports.repository.js';
import * as companyService from '../../company/services/company.service.js';

export const getDashboardStats = async (user_id, fromDateStr, toDateStr, customerName, customerMobile) => {
  let company;
  try {
    company = await companyService.getCompanyProfile(user_id);
  } catch {
    company = null;
  }

  if (!company) {
    return {
      todaySales: 0,
      todayInvoices: 0,
      monthlySales: 0,
      pendingAmount: 0,
      invoices: [],
      company: null
    };
  }

  const stats = await reportsRepo.getDashboardStats(company.id, fromDateStr, toDateStr, customerName, customerMobile);
  return { ...stats, company };
};
