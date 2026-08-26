import express from 'express';
import { verifyMsg91, resendOtp, testLogin, acceptTerms } from './controller/auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/verify-msg91', verifyMsg91);
router.post('/resend-otp', resendOtp);
router.post('/test-login', testLogin);

router.post('/accept-terms', protect, acceptTerms);

export default router;
