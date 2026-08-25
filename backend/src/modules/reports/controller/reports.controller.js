import * as reportsService from '../services/reports.service.js';
import { sendSuccess } from '../../../utils/response.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    const customerName = req.query.customerName;
    const customerMobile = req.query.customerMobile;
    const stats = await reportsService.getDashboardStats(req.user.id, fromDate, toDate, customerName, customerMobile);
    return sendSuccess(res, 'Dashboard stats retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};
