import express from 'express';
import { setupCompany, getProfile } from './controller/company.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', setupCompany);
router.get('/', getProfile);

export default router;
