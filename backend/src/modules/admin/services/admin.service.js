import * as adminRepo from '../repository/admin.repository.js';

export const getDashboardStats = async () => {
  const metrics = await adminRepo.getDashboardMetrics();
  
  const nonPaidUsers = metrics.totalCustomers - metrics.paidUsers;

  return {
    totalCustomers: metrics.totalCustomers,
    customersToday: metrics.customersToday,
    paidUsers: metrics.paidUsers,
    nonPaidUsers,
    monthlyRevenue: metrics.monthlyRevenue,
    totalBills: metrics.totalBills,
    thisMonthBills: metrics.thisMonthBills,
    totalRevenue: metrics.totalRevenue
  };
};

export const getAllCustomers = async () => {
  const users = await adminRepo.getAllCustomers();
  
  return users.map(user => {
    const data = user.toJSON();
    let plan = 'Free Version';
    if (user.subscription_status === 'paid') {
      plan = 'Paid';
      if (data.Subscriptions && data.Subscriptions.length > 0) {
        const activeSub = data.Subscriptions[0];
        if (activeSub.Plan) {
          plan = activeSub.Plan.name;
        }
      }
    } else if (user.subscription_status === 'expired') {
      plan = 'Expired';
    }
    data.plan = plan;
    
    // Include company name and owner name if Company relation exists
    if (user.Company) {
      data.company_name = user.Company.company_name;
      data.owner_name = user.Company.owner_name;
    }
    
    return data;
  });
};

export const deleteCustomer = async (id) => {
  const success = await adminRepo.deleteCustomer(id);
  if (!success) throw { statusCode: 404, message: 'User not found' };
  return { message: 'Customer successfully deleted' };
};

export const getSettings = async () => {
  return await adminRepo.getGlobalSettings();
};

export const updateSettings = async (settingsData) => {
  return await adminRepo.updateGlobalSettings(settingsData);
};

export const getCustomerDetails = async (id) => {
  const user = await adminRepo.getCustomerById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  
  const company = await adminRepo.getCompanyByUserId(id);
  
  return { user, company };
};

export const updateCustomerStatus = async (id, isActive) => {
  const user = await adminRepo.getCustomerById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  
  user.is_active = isActive;
  await user.save();
  return user;
};

export const getAllCompanies = async () => {
  return await adminRepo.getAllCompanies();
};

export const getAllInvoices = async () => {
  return await adminRepo.getAllInvoices();
};

export const getIndividualReports = async () => {
  const users = await adminRepo.getAllCustomers();
  const companies = await adminRepo.getAllCompanies();

  const reports = users.map(user => {
    const userCompany = companies.find(c => c.user_id === user.id);
    
    let plan = 'Free Version';
    if (user.subscription_status === 'paid') {
      plan = 'Paid';
      if (user.Subscriptions && user.Subscriptions.length > 0) {
        const activeSub = user.Subscriptions[0];
        if (activeSub.Plan) {
          plan = activeSub.Plan.name;
        }
      }
    } else if (user.subscription_status === 'expired') {
      plan = 'Expired';
    }

    return {
      id: user.id,
      name: user.name,
      company_name: userCompany ? userCompany.company_name : null,
      owner_name: userCompany ? userCompany.owner_name : null,
      mobile_number: user.mobile_number,
      plan: plan,
      subscription_status: user.subscription_status,
      created_at: user.created_at
    };
  });

  return reports;
};

export const updateAdminProfile = async (id, data) => {
  return await adminRepo.updateAdminProfile(id, data);
};
