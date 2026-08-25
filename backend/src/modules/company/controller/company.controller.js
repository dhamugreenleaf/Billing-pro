import * as companyService from '../services/company.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { companySetupSchema } from '../zod/company.zod.js';

export const setupCompany = async (req, res, next) => {
  try {
    const validatedData = companySetupSchema.parse({ body: req.body });
    const company = await companyService.setupCompany(req.user.id, validatedData.body);
    return sendSuccess(res, 'Company profile updated successfully', company);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyProfile(req.user.id);
    return sendSuccess(res, 'Company profile retrieved successfully', company);
  } catch (error) {
    next(error);
  }
};
