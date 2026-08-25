import Invoice from '../../invoice/model/invoice.model.js';
import { Op } from 'sequelize';
import sequelize from '../../../config/db.js';

export const getDashboardStats = async (company_id, fromDateStr, toDateStr, customerName, customerMobile) => {

  const baseFilters = { company_id };
  if (customerName) {
    baseFilters.customer_name = { [Op.iLike]: `%${customerName}%` };
  }
  if (customerMobile) {
    baseFilters.customer_mobile = { [Op.like]: `%${customerMobile}%` };
  }
  
  // Date filters for stats
  const statsFilters = { ...baseFilters };
  
  // Invoice table filters (includes search)
  const invoiceFilters = { ...baseFilters };

  let dateCondition = {};
  if (fromDateStr || toDateStr) {
    const startDate = fromDateStr ? new Date(fromDateStr) : new Date(0); // Epoch if no from date
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endDate = toDateStr ? new Date(toDateStr) : new Date(); // Today if no to date
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    dateCondition = { created_at: { [Op.between]: [startOfDay, endOfDay] } };
  }

  // Period Sales (Custom Range)
  const todaySales = await Invoice.sum('total_amount', {
    where: { 
      ...statsFilters,
      ...dateCondition
    }
  });

  // Daily Bills
  const todayInvoices = await Invoice.count({
    where: { 
      ...statsFilters,
      ...dateCondition
    }
  });

  // Monthly Sales
  // Determine start of month based on fromDateStr, or current month if empty
  const monthRefDate = fromDateStr ? new Date(fromDateStr) : new Date();
  const startOfMonth = new Date(monthRefDate.getFullYear(), monthRefDate.getMonth(), 1);
  
  const monthlySales = await Invoice.sum('total_amount', {
    where: { ...statsFilters, created_at: { [Op.gte]: startOfMonth } }
  });

  // Pending Amount (Unpaid invoices)
  const pendingAmount = await Invoice.sum('total_amount', {
    where: { ...statsFilters, status: { [Op.not]: 'paid' } }
  });

  // Fetch invoices for the selected day/search
  const invoices = await Invoice.findAll({
    where: { 
      ...invoiceFilters,
      ...dateCondition
    },
    order: [['created_at', 'DESC']],
    limit: 100 // increased limit to show more search results
  });

  return {
    todaySales: todaySales || 0,
    todayInvoices: todayInvoices || 0,
    monthlySales: monthlySales || 0,
    pendingAmount: pendingAmount || 0,
    invoices: invoices
  };
};
