import Plan from '../model/plan.model.js';

export const createPlan = async (data) => {
  return await Plan.create(data);
};

export const updatePlan = async (id, data) => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;
  return await plan.update(data);
};

export const getPlanById = async (id) => {
  return await Plan.findByPk(id);
};

export const getAllPlans = async (filters = {}) => {
  return await Plan.findAll({ where: filters, order: [['price', 'ASC']] });
};

export const updatePlanStatus = async (id, status) => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;
  return await plan.update({ status });
};
