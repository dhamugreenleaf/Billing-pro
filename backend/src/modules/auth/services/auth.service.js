import * as authRepo from '../repository/auth.repository.js';
import { generateToken } from '../../../utils/generateToken.js';
import bcrypt from 'bcryptjs';

export const verifyMsg91Token = async (identifier, accessToken, name) => {
  // Normalize identifier (mobile number) to 10 digits
  const mobile_number = identifier.replace(/\D/g, '').slice(-10);
  
  if (mobile_number.length !== 10) {
    throw { statusCode: 400, message: 'Invalid mobile number format' };
  }

  // Verify token via MSG91 Server-Side Verification API
  const isMockToken = accessToken === "mock_access_token_123456";
  const isDev = process.env.NODE_ENV !== 'production';

  if (isMockToken && isDev) {
    console.log(`[MSG91] Using mock token bypass in development for: ******${mobile_number.slice(-4)}`);
  } else if (process.env.MSG91_AUTH_KEY && process.env.MSG91_WIDGET_ID) {
    try {
      console.log(`[MSG91] Verifying access token for: ******${mobile_number.slice(-4)}`);
      const response = await fetch("https://api.msg91.com/api/v5/widget/verifyAccessToken", {
        method: "POST",
        headers: {
          "authkey": process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "access-token": accessToken
        })
      });

      const data = await response.json();
      
      if (!response.ok || data.type === "error" || data.hasError) {
        throw new Error(data.message || 'Invalid or expired MSG91 token');
      }

      // Check if the verified mobile number matches the requested one
      const verifiedMobile = data.mobile || data.identifier;
      if (verifiedMobile && !verifiedMobile.includes(mobile_number)) {
        throw new Error('Token does not match the provided mobile number');
      }

    } catch (err) {
      console.error("[MSG91] Token Verification Error:", err.message);
      throw { statusCode: 401, message: 'OTP Verification Failed: ' + (err.message || 'Invalid token') };
    }
  } else {
    // Fallback Mock Validation for local dev without MSG91
    if (accessToken !== "mock_access_token_123456") {
      throw { statusCode: 401, message: 'Invalid Dev Token' };
    }
  }

  // Token is verified. Proceed with User Registration / Login
  let user = await authRepo.findUserByMobile(mobile_number);
  
  const isAdminNumber = process.env.ADMIN_PHONE && process.env.ADMIN_PHONE === mobile_number;
  const computedRole = isAdminNumber ? 'admin' : 'customer';

  if (!user) {
    user = await authRepo.createUser({ mobile_number, name: name || 'User', role: computedRole });
  } else if (user.role !== computedRole) {
    user.role = computedRole;
    await user.save();
  }

  if (user.is_deleted) {
    throw { statusCode: 403, message: 'Your account has been deleted. Please contact support.' };
  }

  const token = generateToken(user.id, null, user.role);

  return {
    user: {
      id: user.id,
      mobile_number: user.mobile_number,
      name: user.name,
      role: user.role,
      profile_completed: user.profile_completed,
      terms_accepted_at: user.terms_accepted_at
    },
    token
  };
};

export const resendMsg91Otp = async (identifier) => {
  const mobile_number = identifier.replace(/\D/g, '').slice(-10);
  
  if (mobile_number.length !== 10) {
    throw { statusCode: 400, message: 'Invalid mobile number format' };
  }

  if (process.env.MSG91_AUTH_KEY) {
    try {
      console.log(`[MSG91] Resending OTP for: ******${mobile_number.slice(-4)}`);
      // Standard Retry OTP API requires mobile with country code
      const mobileWithCode = `91${mobile_number}`;
      const url = `https://api.msg91.com/api/v5/otp/retry?retrytype=text&mobile=${mobileWithCode}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "authkey": process.env.MSG91_AUTH_KEY
        }
      });

      const data = await response.json();
      
      if (!response.ok || data.type === "error" || data.hasError) {
        // If it says already verified or something we can just return success or throw
        if (data.message && data.message.toLowerCase().includes('already verified')) {
          return { success: true, message: 'Already verified' };
        }
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return { success: true, message: 'OTP resent successfully' };
    } catch (err) {
      console.error("[MSG91] Resend OTP Error:", err.message);
      throw { statusCode: 400, message: 'Failed to resend OTP: ' + (err.message || 'Unknown error') };
    }
  } else {
    // Fallback Mock Validation for local dev without MSG91
    return { success: true, message: 'Mock OTP resent successfully' };
  }
};

export const testLoginService = async (username, password) => {
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
      terms_accepted_at: user.terms_accepted_at
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
    terms_accepted_at: user.terms_accepted_at
  };
};
