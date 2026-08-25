import express from 'express';
import * as adminController from './controller/admin.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetails);
router.put('/customers/:id/status', adminController.updateCustomerStatus);
router.delete('/customers/:id', adminController.deleteCustomer);
router.get('/companies', adminController.getCompanies);
router.get('/invoices', adminController.getInvoices);
router.get('/reports/individual', adminController.getIndividualReports);

// Settings Routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Profile Route
router.put('/profile', adminController.updateAdminProfile);

export default router;
