import express from 'express';
import { verifyMsg91, sendOtp, resendOtp, testLogin, acceptTerms, checkAdmin, getMe } from './controller/auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.post('/send-otp', sendOtp);
router.post('/verify-msg91', verifyMsg91);
router.post('/resend-otp', resendOtp);
router.post('/check-admin', checkAdmin);

// Test login is strictly disabled in production
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-login', testLogin);
}

router.post('/accept-terms', protect, acceptTerms);

export default router;
