import * as authRepo from '../repository/auth.repository.js';
import { generateToken } from '../../../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// Token verification deduplication & short-lived cache (TTL 2 minutes)
const tokenCache = new Map();
const pendingVerifications = new Map();

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > 120000) {
      tokenCache.delete(token);
    }
  }
}, 60000).unref();

export const verifyMsg91Token = async (identifier, accessToken, name, loginType = 'user') => {
  const serviceStartTime = Date.now();
  // Normalize identifier (mobile number) to 10 digits
  const mobile_number = String(identifier || '').replace(/\D/g, '').slice(-10);
  
  if (mobile_number.length !== 10) {
    throw { statusCode: 400, code: 'INVALID_MOBILE', message: 'Mobile number must be a valid 10-digit number.' };
  }

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 4) {
    throw { statusCode: 400, code: 'INVALID_TOKEN', message: 'Access token or OTP is required and must be valid.' };
  }

  console.log('[MSG91 Service] Verification Initiated:');
  console.log(`[MSG91 Service]   Identifier: ${identifier} -> Normalized: ${mobile_number}`);
  console.log(`[MSG91 Service]   Login Type: ${loginType}`);
  console.log(`[MSG91 Service]   Access Token: [PRESENT] (Length: ${accessToken.length})`);

  // 1. Check in-memory recent token cache (Idempotency / Deduplication)
  const cached = tokenCache.get(accessToken);
  if (cached && (Date.now() - cached.timestamp < 120000)) {
    console.log(`[MSG91 Idempotency] Returning cached session for: ******${mobile_number.slice(-4)} (Token verified ${Date.now() - cached.timestamp}ms ago)`);
    return cached.result;
  }

  // 2. If verification is currently in-flight for this token, join the existing promise
  if (pendingVerifications.has(accessToken)) {
    console.log(`[MSG91 Idempotency] Request already in-flight for token. Joining active verification promise...`);
    return await pendingVerifications.get(accessToken);
  }

  const verificationPromise = (async () => {
    const isMockToken = accessToken === "mock_access_token_123456";
    const isDev = process.env.NODE_ENV !== 'production';

    // Check environment configuration
    const authKey = process.env.MSG91_AUTH_KEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    console.log('[MSG91 Config Diagnostic]', {
      authKeyConfigured: !!authKey,
      widgetIdConfigured: !!widgetId,
      nodeEnv: process.env.NODE_ENV || 'development'
    });

    if (isMockToken && isDev) {
      console.log(`[MSG91 Dev] Using mock token bypass in development for: ******${mobile_number.slice(-4)}`);
    } else if (authKey) {
      const isDirectOtp = /^\d{4,6}$/.test(accessToken);

      if (isDirectOtp) {
        console.log(`[MSG91 Direct OTP] Verifying OTP directly for: ******${mobile_number.slice(-4)}`);
        const directUrl = `https://control.msg91.com/api/v5/otp/verify?otp=${accessToken}&mobile=91${mobile_number}`;
        let directRes;
        try {
          directRes = await fetch(directUrl, {
            method: 'GET',
            headers: { 'authkey': authKey }
          });
        } catch (netErr) {
          console.error('[MSG91 Direct OTP] Network error:', netErr.message);
          throw { statusCode: 503, code: 'MSG91_UNAVAILABLE', message: 'Unable to connect to OTP verification provider. Please try again.' };
        }

        const directData = await directRes.json();
        console.log(`[MSG91 Direct OTP] Result:`, directData);

        const isSuccess = directRes.ok && (
          directData.type === 'success' ||
          directData.message?.toLowerCase().includes('success') ||
          directData.message?.toLowerCase().includes('already verified')
        );

        if (!isSuccess) {
          const rawMessage = String(directData.message || directData.error || 'Invalid OTP');
          if (rawMessage.toLowerCase().includes('expired')) {
            throw { statusCode: 400, code: 'OTP_EXPIRED', message: 'OTP token has expired. Please request a new OTP.' };
          }
          throw { statusCode: 400, code: 'OTP_INVALID', message: 'Invalid OTP. Please check the code and try again.' };
        }
      } else if (widgetId) {
        const outboundUrl = "https://api.msg91.com/api/v5/widget/verifyAccessToken";
        const outboundPayload = { "access-token": accessToken };

        console.log('[MSG91 Outbound] Target URL:', outboundUrl);
        console.log('[MSG91 Outbound] Payload: [TOKEN_PAYLOAD]');
        console.log('[MSG91 Outbound] Headers:', {
          "authkey": "[REDACTED]",
          "Content-Type": "application/json"
        });

        // 8-second timeout using AbortController (well within MSG91's 2-min window)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        let response;

        try {
          response = await fetch(outboundUrl, {
            method: "POST",
            headers: {
              "authkey": authKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(outboundPayload),
            signal: controller.signal
          });
        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') {
            console.error('[MSG91 Inbound] Outbound call timed out after 8000ms');
            throw { statusCode: 408, code: 'MSG91_TIMEOUT', message: 'Verification service timed out. Please try again.' };
          }
          console.error('[MSG91 Inbound] Outbound network failure:', fetchErr.message);
          throw { statusCode: 503, code: 'MSG91_UNAVAILABLE', message: 'Unable to connect to OTP verification provider. Please try again.' };
        } finally {
          clearTimeout(timeoutId);
        }

        // Log raw response BEFORE parsing
        const rawResponseBody = await response.text();
        console.log(`[MSG91 Inbound] HTTP Status: ${response.status} ${response.statusText}`);
        console.log(`[MSG91 Inbound] Raw Response Body: ${rawResponseBody}`);

        let data;
        try {
          data = JSON.parse(rawResponseBody);
        } catch (parseErr) {
          console.error('[MSG91 Inbound] JSON parsing failed for raw response:', rawResponseBody);
          throw { statusCode: 400, code: 'MSG91_MALFORMED', message: 'Received malformed response from verification provider.' };
        }

        const isError = !response.ok || data.type === "error" || data.hasError || data.status === "error";

        if (isError) {
          const rawMessage = String(data.message || data.error || 'Verification failed');
          console.warn(`[MSG91 Inbound] Provider reported error: "${rawMessage}"`);

          if (rawMessage.toLowerCase().includes('already verified')) {
            console.log(`[MSG91 Idempotency] Access token was already verified by MSG91. Proceeding with user lookup.`);
            // Token is already verified with MSG91 - allow proceeding to user session lookup
          } else if (rawMessage.toLowerCase().includes('expired')) {
            throw { statusCode: 400, code: 'OTP_EXPIRED', message: 'OTP token has expired. Please request a new OTP.' };
          } else if (rawMessage.toLowerCase().includes('invalid')) {
            throw { statusCode: 400, code: 'OTP_INVALID', message: 'Invalid or expired OTP token. Please try again.' };
          } else {
            throw { statusCode: 400, code: 'MSG91_ERROR', message: rawMessage || 'OTP verification failed. Please try again.' };
          }
        } else {
          // Validate that verified mobile matches the client-submitted mobile number
          const verifiedMobile = data.mobile || data.identifier || data.data?.mobile || data.data?.identifier;
          if (verifiedMobile && !String(verifiedMobile).includes(mobile_number)) {
            console.error(`[MSG91 Security] Mobile mismatch! Verified: ${verifiedMobile}, Expected: ${mobile_number}`);
            throw { statusCode: 400, code: 'MOBILE_MISMATCH', message: 'Verified token does not match the entered mobile number.' };
          }
        }
      } else {
        throw { statusCode: 401, code: 'CONFIG_MISSING', message: 'OTP verification service is not fully configured.' };
      }
    } else {
      // Fallback Mock Validation for local dev without MSG91
      if (accessToken !== "mock_access_token_123456") {
        console.warn('[MSG91 Config] Missing MSG91_AUTH_KEY in server environment');
        throw { statusCode: 401, code: 'CONFIG_MISSING', message: 'OTP verification service is not configured.' };
      }
    }

    // Token verified successfully. Look up or create user record
    const computedRole = loginType === 'admin' ? 'admin' : 'customer';
    let user = await authRepo.findUserByMobileAndRole(mobile_number, computedRole);
    
    if (!user) {
      try {
        user = await authRepo.createUser({
          mobile_number,
          name: name || (loginType === 'admin' ? 'Admin' : 'User'),
          role: computedRole
        });
        console.log(`[Auth Service] Created new ${computedRole} user (ID: ${user.id}) for ******${mobile_number.slice(-4)}`);
      } catch (createErr) {
        // Handle concurrent insert race condition gracefully
        user = await authRepo.findUserByMobileAndRole(mobile_number, computedRole);
        if (!user) {
          console.error("[Auth Service] User creation failed:", createErr);
          throw { statusCode: 400, code: 'USER_CREATION_FAILED', message: 'Unable to initialize user profile. Please try again.' };
        }
      }
    }

    if (user.is_deleted) {
      throw { statusCode: 403, code: 'ACCOUNT_DELETED', message: 'Your account has been deleted. Please contact support.' };
    }

    const token = generateToken(user.id, null, user.role);

    const result = {
      user: {
        id: user.id,
        mobile_number: user.mobile_number,
        name: user.name,
        role: user.role,
        profile_completed: user.profile_completed,
        terms_accepted_at: user.terms_accepted_at,
        subscription_status: user.subscription_status
      },
      token
    };

    tokenCache.set(accessToken, { result, timestamp: Date.now() });
    console.log(`[MSG91 Service] Verification pipeline complete in ${Date.now() - serviceStartTime}ms for user ${user.id}`);
    return result;
  })();

  pendingVerifications.set(accessToken, verificationPromise);
  try {
    return await verificationPromise;
  } finally {
    pendingVerifications.delete(accessToken);
  }
};

export const sendMsg91Otp = async (identifier) => {
  const mobile_number = identifier.replace(/\D/g, '').slice(-10);
  
  if (mobile_number.length !== 10) {
    throw { statusCode: 400, message: 'Invalid mobile number format' };
  }

  if (process.env.MSG91_AUTH_KEY) {
    try {
      console.log(`[MSG91] Sending OTP for: ******${mobile_number.slice(-4)}`);
      const mobileWithCode = `91${mobile_number}`;
      const sendUrl = `https://control.msg91.com/api/v5/otp?mobile=${mobileWithCode}&otp_length=4`;
      
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "authkey": process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      console.log(`[MSG91] Send OTP response:`, data);

      if (!response.ok || data.type === "error" || data.hasError) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return { success: true, message: 'OTP sent successfully', requestId: data.request_id };
    } catch (err) {
      console.error("[MSG91] Send OTP Error:", err.message);
      throw { statusCode: 400, message: 'Failed to send OTP: ' + (err.message || 'Unknown error') };
    }
  } else {
    return { success: true, message: 'OTP sent successfully (dev mock)' };
  }
};

export const resendMsg91Otp = async (identifier) => {
  const mobile_number = identifier.replace(/\D/g, '').slice(-10);
  
  if (mobile_number.length !== 10) {
    throw { statusCode: 400, message: 'Invalid mobile number format' };
  }

  if (process.env.MSG91_AUTH_KEY) {
    try {
      console.log(`[MSG91] Resending OTP for: ******${mobile_number.slice(-4)}`);
      const mobileWithCode = `91${mobile_number}`;
      // Always dispatch a fresh OTP via reliable send endpoint so user receives a valid OTP
      // and never gets blocked by "last_otp_request_on_this_number_is_invalid"
      const sendUrl = `https://control.msg91.com/api/v5/otp?mobile=${mobileWithCode}&otp_length=4&retrytype=text`;
      
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "authkey": process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      console.log(`[MSG91] Resend OTP response:`, data);
      
      if (!response.ok || data.type === "error" || data.hasError) {
        if (data.message && data.message.toLowerCase().includes('already verified')) {
          return { success: true, message: 'Already verified' };
        }
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return { success: true, message: 'OTP resent successfully', requestId: data.request_id };
    } catch (err) {
      console.error("[MSG91] Resend OTP Error:", err.message);
      throw { statusCode: 400, message: 'Failed to send OTP: ' + (err.message || 'Unknown error') };
    }
  } else {
    return { success: true, message: 'Mock OTP resent successfully' };
  }
};

export const testLoginService = async (username, password) => {
  if (process.env.NODE_ENV === 'production') {
    throw { statusCode: 404, message: 'Test login is disabled in production' };
  }

  if (username !== 'sanjay') {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  let user = await authRepo.findUserByUsername(username);

  if (!user) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    user = await authRepo.createUser({
      mobile_number: '0000000000',
      name: 'Razorpay Test User',
      role: 'customer',
      username: 'sanjay',
      password: hashedPassword
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const token = generateToken(user.id, null, user.role);

  return {
    user: {
      id: user.id,
      mobile_number: user.mobile_number,
      name: user.name,
      role: user.role,
      profile_completed: user.profile_completed,
      terms_accepted_at: user.terms_accepted_at,
      subscription_status: user.subscription_status
    },
    token
  };
};

export const acceptUserTerms = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  
  user.terms_accepted_at = new Date();
  await user.save();
  
  return {
    id: user.id,
    mobile_number: user.mobile_number,
    name: user.name,
    role: user.role,
    profile_completed: user.profile_completed,
    terms_accepted_at: user.terms_accepted_at,
    subscription_status: user.subscription_status
  };
};

export const getCurrentUserService = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return {
    id: user.id,
    mobile_number: user.mobile_number,
    name: user.name,
    role: user.role,
    profile_completed: user.profile_completed,
    terms_accepted_at: user.terms_accepted_at,
    subscription_status: user.subscription_status
  };
};

export const checkAdminService = async (mobile_number) => {
  const number = mobile_number.replace(/\D/g, '').slice(-10);
  if (number.length !== 10) return false;
  
  if (process.env.ADMIN_PHONE && process.env.ADMIN_PHONE === number) {
    return true;
  }
  
  const user = await authRepo.findUserByMobileAndRole(number, 'admin');
  if (user) {
    return true;
  }
  
  return false;
};
