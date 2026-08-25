import express from 'express';
import { verifyMsg91, resendOtp, testLogin } from './controller/auth.controller.js';

const router = express.Router();

router.post('/verify-msg91', verifyMsg91);
router.post('/resend-otp', resendOtp);
router.post('/test-login', testLogin);

export default router;
