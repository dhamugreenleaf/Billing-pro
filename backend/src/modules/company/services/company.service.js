import * as companyRepo from '../repository/company.repository.js';

import * as authRepo from '../../auth/repository/auth.repository.js';

export const setupCompany = async (user_id, companyData) => {
  let company = await companyRepo.findCompanyByUserId(user_id);
  
  if (company) {
    company = await companyRepo.updateCompany(company.id, companyData);
  } else {
    company = await companyRepo.createCompany({ ...companyData, user_id });
    // Mark user profile as completed
    const user = await authRepo.findUserById(user_id);
    if (user) {
      user.profile_completed = true;
      await user.save();
    }
  }

  return company;
};

export const getCompanyProfile = async (user_id) => {
  const company = await companyRepo.findCompanyByUserId(user_id);
  if (!company) {
    throw { statusCode: 404, message: 'Company profile not found' };
  }
  return company;
};
