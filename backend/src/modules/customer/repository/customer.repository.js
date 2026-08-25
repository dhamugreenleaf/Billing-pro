import Customer from '../model/customer.model.js';

export const findCustomerByMobile = async (company_id, mobile_number) => {
  return await Customer.findOne({ where: { company_id, mobile_number } });
};

export const createCustomer = async (customerData) => {
  return await Customer.create(customerData);
};

export const getAllCustomers = async (company_id) => {
  return await Customer.findAll({ where: { company_id } });
};
