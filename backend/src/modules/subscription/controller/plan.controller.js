import * as planService from '../services/plan.service.js';

export const getAllPlans = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const plans = await planService.getAllPlans(isAdmin);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw { statusCode: 403, message: 'Forbidden' };
    const plan = await planService.createPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw { statusCode: 403, message: 'Forbidden' };
    const plan = await planService.updatePlan(req.params.id, req.body);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlanStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw { statusCode: 403, message: 'Forbidden' };
    const plan = await planService.updatePlanStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};
