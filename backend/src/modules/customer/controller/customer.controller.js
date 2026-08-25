import * as customerService from '../services/customer.service.js';
import * as companyService from '../../company/services/company.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { createCustomerSchema } from '../zod/customer.zod.js';

// Helper to get company_id from user
const getCompanyId = async (user_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) throw new Error('Company not found. Please setup company profile first.');
  return company.id;
};

export const createCustomer = async (req, res, next) => {
  try {
    const validatedData = createCustomerSchema.parse({ body: req.body });
    const company_id = await getCompanyId(req.user.id);
    const customer = await customerService.findOrCreateCustomer(company_id, validatedData.body);
    return sendSuccess(res, 'Customer processed successfully', customer, 201);
  } catch (error) {
    if (error.message.includes('Company not found')) {
      return sendError(res, error.message, [], 400);
    }
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const company_id = await getCompanyId(req.user.id);
    const customers = await customerService.getCustomers(company_id);
    return sendSuccess(res, 'Customers retrieved successfully', customers);
  } catch (error) {
    if (error.message.includes('Company not found')) {
      return sendError(res, error.message, [], 400);
    }
    next(error);
  }
};

export const getCustomerByMobile = async (req, res, next) => {
  try {
    const { mobile } = req.params;
    const company_id = await getCompanyId(req.user.id);
    const customer = await customerService.getCustomerByMobile(company_id, mobile);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    return sendSuccess(res, 'Customer retrieved successfully', customer);
  } catch (error) {
    if (error.message.includes('Company not found')) {
      return sendError(res, error.message, [], 400);
    }
    next(error);
  }
};
