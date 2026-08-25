import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { verifyMsg91Schema, resendOtpSchema } from '../zod/auth.zod.js';

export const verifyMsg91 = async (req, res, next) => {
  try {
    const validatedData = verifyMsg91Schema.parse({ body: req.body });
    const result = await authService.verifyMsg91Token(
      validatedData.body.identifier,
      validatedData.body.accessToken,
      validatedData.body.name
    );
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const validatedData = resendOtpSchema.parse({ body: req.body });
    const result = await authService.resendMsg91Otp(validatedData.body.identifier);
    return sendSuccess(res, 'OTP resent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const testLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const result = await authService.testLoginService(username, password);
    return sendSuccess(res, 'Test login successful', result);
  } catch (error) {
    next(error);
  }
};
