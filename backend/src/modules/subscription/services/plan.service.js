import * as planRepo from '../repository/plan.repository.js';

export const getAllPlans = async (adminOnly = false) => {
  const filters = adminOnly ? {} : { status: 'active' };
  return await planRepo.getAllPlans(filters);
};

export const createPlan = async (data) => {
  return await planRepo.createPlan(data);
};

export const updatePlan = async (id, data) => {
  const updated = await planRepo.updatePlan(id, data);
  if (!updated) throw { statusCode: 404, message: 'Plan not found' };
  return updated;
};

export const updatePlanStatus = async (id, status) => {
  if (!['active', 'inactive'].includes(status)) {
    throw { statusCode: 400, message: 'Invalid status' };
  }
  const updated = await planRepo.updatePlanStatus(id, status);
  if (!updated) throw { statusCode: 404, message: 'Plan not found' };
  return updated;
};
