import Company from '../model/company.model.js';

export const findCompanyByUserId = async (user_id) => {
  return await Company.findOne({ where: { user_id } });
};

export const createCompany = async (companyData) => {
  return await Company.create(companyData);
};

export const updateCompany = async (id, companyData) => {
  await Company.update(companyData, { where: { id } });
  return await Company.findByPk(id);
};
