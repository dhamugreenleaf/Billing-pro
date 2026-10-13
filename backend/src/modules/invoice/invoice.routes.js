import express from 'express';
import { createInvoice, getAllInvoices, getInvoice, updateInvoiceTemplate, deleteInvoice } from './controller/invoice.controller.js';
import { recordPayment, getInvoicePayments } from './controller/payment.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireInvoiceFormat } from '../../middleware/checkPlanAccess.js';

const router = express.Router();

router.use(protect);

router.post('/', createInvoice);
router.get('/', getAllInvoices);
router.get('/:id', getInvoice);
router.patch('/:id/template', requireInvoiceFormat, updateInvoiceTemplate);
router.delete('/:id', deleteInvoice);

// Payment routes
router.post('/:id/payment', recordPayment);
router.get('/:id/payments', getInvoicePayments);

export default router;
