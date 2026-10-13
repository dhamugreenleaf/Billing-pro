import * as customerRepo from '../repository/customer.repository.js';

export const findOrCreateCustomer = async (company_id, customerData) => {
  let customer = await customerRepo.findCustomerByMobile(company_id, customerData.mobile_number);
  
  if (!customer) {
    customer = await customerRepo.createCustomer({ ...customerData, company_id });
  } else {
    let updated = false;
    if (customerData.name && customer.name !== customerData.name) {
      if (!customer.name || customerData.name !== 'Cash Customer') {
        customer.name = customerData.name;
        updated = true;
      }
    }
    if (customerData.billing_address && customer.billing_address !== customerData.billing_address) {
      if (!customer.billing_address || !['Store Counter', 'Store Walk-in'].includes(customerData.billing_address)) {
        customer.billing_address = customerData.billing_address;
        updated = true;
      }
    }
    if (customerData.shipping_address && customer.shipping_address !== customerData.shipping_address) {
      if (!customer.shipping_address || !['Store Counter', 'Store Walk-in'].includes(customerData.shipping_address)) {
        customer.shipping_address = customerData.shipping_address;
        updated = true;
      }
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
