import express from 'express';
import { createCustomer, getAllCustomers, getCustomerByMobile } from './controller/customer.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.get('/mobile/:mobile', getCustomerByMobile);

export default router;
