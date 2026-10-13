import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_PROD_VARS = [
  'JWT_SECRET',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'MSG91_AUTH_KEY',
  'MSG91_WIDGET_ID'
];

/**
 * Validates environment variables for production readiness.
 * In production (NODE_ENV=production):
 * - Checks for the presence and non-emptiness of all required secrets.
 * - Forbids insecure or predictable secrets like 'secret123'.
 * - Fails safely with a clear configuration error without exposing secret values.
 */
export const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const missing = REQUIRED_PROD_VARS.filter(
      (key) => !process.env[key] || process.env[key].trim() === ''
    );

    if (missing.length > 0) {
      const errorMsg = `[CONFIG ERROR] Critical configuration error: Missing required production secret(s): ${missing.join(', ')}. Server startup aborted.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (process.env.JWT_SECRET === 'secret123') {
      const errorMsg = '[CONFIG ERROR] Insecure JWT_SECRET value detected. Cannot use default or test secret in production.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
};

/**
 * Retrieves the JWT Secret securely.
 * Throws in production if missing or using insecure default.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret.trim() === '') {
    if (isProd) {
      throw new Error('JWT_SECRET environment variable is missing in production');
    }
    // Strictly non-production local development fallback
    return 'billing_simply_dev_secret_local_only';
  }

  if (isProd && secret === 'secret123') {
    throw new Error('Insecure JWT_SECRET value cannot be used in production');
  }

  return secret;
};

export default {
  validateEnv,
  getJwtSecret
};
