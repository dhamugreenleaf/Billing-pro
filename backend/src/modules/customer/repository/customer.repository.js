import Customer from '../model/customer.model.js';
import sequelize from '../../../config/db.js';

export const findCustomerByMobile = async (company_id, mobile_number) => {
  return await Customer.findOne({ where: { company_id, mobile_number } });
};

export const createCustomer = async (customerData) => {
  return await Customer.create(customerData);
};

export const getAllCustomers = async (company_id) => {
  return await Customer.findAll({ where: { company_id } });
};

/**
 * Calculates authoritative customer outstanding balance across all invoices for a company.
 * Paid invoices contribute ₹0. Unpaid and partial invoices contribute (total - paid).
 */
export const getCustomerOutstandingBalance = async (company_id, customerMobileOrId) => {
  const isMobile = typeof customerMobileOrId === 'string' && /^\d+$/.test(customerMobileOrId);
  const whereCol = isMobile ? 'customer_mobile' : 'customer_id';

  const [result] = await sequelize.query(`
    SELECT COALESCE(SUM(GREATEST(CAST(total_amount AS NUMERIC) - CAST(paid_amount AS NUMERIC), 0)), 0) AS balance
    FROM invoices
    WHERE company_id = :company_id
      AND ${whereCol} = :val
      AND payment_status != 'paid'
      AND status != 'paid'
  `, {
    replacements: { company_id, val: customerMobileOrId },
    type: sequelize.QueryTypes.SELECT
  });

  return result ? parseFloat(result.balance) || 0 : 0;
};
