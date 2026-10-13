import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { verifyMsg91Schema, sendOtpSchema, resendOtpSchema } from '../zod/auth.zod.js';

export const sendOtp = async (req, res, next) => {
  try {
    const validatedData = sendOtpSchema.parse({ body: req.body });
    const result = await authService.sendMsg91Otp(validatedData.body.identifier);
    return sendSuccess(res, 'OTP sent successfully', result);
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

export const verifyMsg91 = async (req, res, next) => {
  const startTime = Date.now();
  console.log('\n================== [MSG91 INCOMING REQUEST] ==================');
  console.log(`[MSG91 Handler] Timestamp: ${new Date().toISOString()}`);
  const sanitizedLogBody = { ...req.body };
  if (sanitizedLogBody.accessToken) sanitizedLogBody.accessToken = '[REDACTED]';
  if (sanitizedLogBody.password) sanitizedLogBody.password = '[REDACTED]';
  console.log('[MSG91 Handler] Sanitized Request Body:', JSON.stringify(sanitizedLogBody, null, 2));

  try {
    const validatedData = verifyMsg91Schema.parse({ body: req.body });
    const result = await authService.verifyMsg91Token(
      validatedData.body.identifier,
      validatedData.body.accessToken,
      validatedData.body.name,
      validatedData.body.loginType
    );

    const elapsed = Date.now() - startTime;
    console.log(`[MSG91 Handler] Verification SUCCESS for ${validatedData.body.identifier} in ${elapsed}ms`);
    console.log('==============================================================\n');
    return sendSuccess(res, 'Login successful', result);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[MSG91 Handler] Verification FAILED in ${elapsed}ms:`, error.message || error);

    // If it's a Zod schema validation error
    if (error.name === 'ZodError') {
      const detail = error.errors?.[0]?.message || 'Invalid input data';
      console.warn(`[MSG91 Handler] Validation error: ${detail}`);
      console.log('==============================================================\n');
      return res.status(422).json({
        success: false,
        message: `Validation failed: ${detail}`,
        errors: error.errors
      });
    }

    // Determine clean HTTP status (always 4xx for client / provider issues, never 500)
    const statusCode = (error.statusCode && error.statusCode >= 400 && error.statusCode < 500)
      ? error.statusCode
      : (error.statusCode === 503 ? 503 : 400);

    const message = error.message || 'OTP verification failed. Please try again.';

    console.log(`[MSG91 Handler] Responding with HTTP ${statusCode}: "${message}"`);
    console.log('==============================================================\n');

    return res.status(statusCode).json({
      success: false,
      message,
      code: error.code || 'OTP_VERIFICATION_FAILED'
    });
  }
};


export const testLogin = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
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

export const acceptTerms = async (req, res, next) => {
  try {
    const user = await authService.acceptUserTerms(req.user.id);
    return sendSuccess(res, 'Terms accepted successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const checkAdmin = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }
    const isAdmin = await authService.checkAdminService(identifier);
    return sendSuccess(res, 'Admin check complete', { isAdmin });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUserService(req.user.id);
    return sendSuccess(res, 'Current user profile fetched successfully', { user });
  } catch (error) {
    next(error);
  }
};

