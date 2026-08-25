import express from 'express';
import * as planController from './controller/plan.controller.js';
import * as subController from './controller/subscription.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Webhook endpoint (unprotected)
router.post('/webhook', subController.handleWebhook);

// Apply auth middleware
router.use(protect);

// Plans
router.get('/plans', planController.getAllPlans); // Customer can view active plans
// Admin plan management is mounted on /api/admin/plans in admin.routes.js (or we can put it here)
// Let's put admin routes here but protect them with role check in the controller (already done)
router.post('/plans', planController.createPlan);
router.put('/plans/:id', planController.updatePlan);
router.patch('/plans/:id/status', planController.updatePlanStatus);

// Subscriptions
router.get('/current', subController.getCurrentSubscription);
router.post('/create-order', subController.createOrder);
router.post('/verify-payment', subController.verifyPayment);

// Invoice Formats
router.get('/invoice-formats', subController.getInvoiceFormatsAvailability);
router.get('/admin/invoice-formats', subController.getAllInvoiceFormats);
router.patch('/admin/invoice-formats/:id/status', subController.updateInvoiceFormatStatus);

export default router;
