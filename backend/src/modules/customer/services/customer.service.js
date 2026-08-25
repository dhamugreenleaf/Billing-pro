import * as customerRepo from '../repository/customer.repository.js';

export const findOrCreateCustomer = async (company_id, customerData) => {
  let customer = await customerRepo.findCustomerByMobile(company_id, customerData.mobile_number);
  
  if (!customer) {
    customer = await customerRepo.createCustomer({ ...customerData, company_id });
  } else {
    let updated = false;
    if (customerData.name && customer.name !== customerData.name) {
      customer.name = customerData.name;
      updated = true;
    }
    if (customerData.address && customer.address !== customerData.address) {
      customer.address = customerData.address;
      updated = true;
    }
    if (updated) {
      await customer.save();
    }
  }

  return customer;
};

export const getCustomers = async (company_id) => {
  return await customerRepo.getAllCustomers(company_id);
};

export const getCustomerByMobile = async (company_id, mobile) => {
  return await customerRepo.findCustomerByMobile(company_id, mobile);
};
