import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { validateEnv, getJwtSecret } from '../src/config/env.js';
import { generateToken } from '../src/utils/generateToken.js';
import jwt from 'jsonwebtoken';

describe('Production Secrets & .ENV Security Suite', () => {
  const originalEnv = { ...process.env };

  after(() => {
    process.env = originalEnv;
  });

  test('TEST 1: JWT Secret loaded from environment properly', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'valid_production_secret_key_999';

    const secret = getJwtSecret();
    assert.equal(secret, 'valid_production_secret_key_999');

    const token = generateToken(1, 2, 'user');
    const decoded = jwt.verify(token, 'valid_production_secret_key_999');
    assert.equal(decoded.id, 1);
    assert.equal(decoded.company_id, 2);
    assert.equal(decoded.role, 'user');
  });

  test('TEST 2: No hardcoded secret123 fallback exists in auth code', () => {
    const generateTokenPath = path.resolve('src/utils/generateToken.js');
    const authMiddlewarePath = path.resolve('src/middleware/auth.middleware.js');

    const generateTokenContent = fs.readFileSync(generateTokenPath, 'utf8');
    const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');

    assert.ok(!generateTokenContent.includes('secret123'), 'generateToken.js must not contain secret123');
    assert.ok(!authMiddlewareContent.includes('secret123'), 'auth.middleware.js must not contain secret123');
  });

  test('TEST 3: Missing production JWT_SECRET fails safely without leaking secrets', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    assert.throws(
      () => {
        getJwtSecret();
      },
      (err) => {
        assert.ok(err.message.includes('missing in production'));
        return true;
      }
    );

    assert.throws(
      () => {
        validateEnv();
      },
      (err) => {
        assert.ok(err.message.includes('Missing required production secret'));
        assert.ok(!err.message.includes('password')); // Does not leak actual password values
        return true;
      }
    );
  });

  test('TEST 4: Insecure secret123 in production fails validation', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret123';
    process.env.DB_NAME = 'billing';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'password';
    process.env.RAZORPAY_KEY_ID = 'rzp_id';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_sec';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec';
    process.env.MSG91_AUTH_KEY = 'authkey';
    process.env.MSG91_WIDGET_ID = 'widget';

    assert.throws(
      () => {
        validateEnv();
      },
      (err) => {
        assert.ok(err.message.includes('Insecure JWT_SECRET value detected'));
        return true;
      }
    );
  });

  test('TEST 5: Real .env files are NOT tracked by Git', () => {
    try {
      const gitTracked = execSync('git ls-files', { cwd: path.resolve('..') }).toString();
      const trackedLines = gitTracked.split('\n').map((l) => l.trim());

      assert.ok(!trackedLines.includes('backend/.env'), 'backend/.env must not be tracked by git');
      assert.ok(!trackedLines.includes('frontend/.env'), 'frontend/.env must not be tracked by git');
      assert.ok(!trackedLines.includes('.env'), '.env must not be tracked by git');
    } catch (err) {
      // In non-git environment, verify .gitignore exists
      const rootGitignore = fs.readFileSync(path.resolve('../.gitignore'), 'utf8');
      assert.ok(rootGitignore.includes('.env'));
    }
  });

  test('TEST 6: backend/.env.example contains placeholders only', () => {
    const envExamplePath = path.resolve('.env.example');
    assert.ok(fs.existsSync(envExamplePath), 'backend/.env.example must exist');

    const content = fs.readFileSync(envExamplePath, 'utf8');
    assert.ok(content.includes('JWT_SECRET='), 'Must include JWT_SECRET placeholder');
    assert.ok(content.includes('RAZORPAY_KEY_SECRET='), 'Must include RAZORPAY_KEY_SECRET placeholder');
    assert.ok(content.includes('MSG91_AUTH_KEY='), 'Must include MSG91_AUTH_KEY placeholder');
    assert.ok(content.includes('DB_PASSWORD='), 'Must include DB_PASSWORD placeholder');

    // Verify it doesn't contain real secret values
    assert.ok(!content.includes('Sanjay@1218'), 'Must not contain database password');
    assert.ok(!content.includes('560885'), 'Must not contain MSG91 key');
    assert.ok(!content.includes('KtzGD438'), 'Must not contain Razorpay secret');
  });

  test('TEST 7: Frontend does not contain hardcoded MSG91 auth fallbacks', () => {
    const loginPath = path.resolve('../frontend/src/modules/auth/Login.jsx');
    const adminLoginPath = path.resolve('../frontend/src/modules/auth/AdminLogin.jsx');

    const loginContent = fs.readFileSync(loginPath, 'utf8');
    const adminLoginContent = fs.readFileSync(adminLoginPath, 'utf8');

    assert.ok(!loginContent.includes('560885T2kcvOrbS46a82e3fcP1'), 'Login.jsx must not have hardcoded tokenAuth fallback');
    assert.ok(!adminLoginContent.includes('560885T2kcvOrbS46a82e3fcP1'), 'AdminLogin.jsx must not have hardcoded tokenAuth fallback');
  });

  test('TEST 8: Full valid production environment passes validation cleanly', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'strong_production_random_secret_44891bca';
    process.env.DB_NAME = 'billing_prod';
    process.env.DB_USER = 'billing_user';
    process.env.DB_PASSWORD = 'strong_db_password_xyz';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_abc123';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_def456';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_ghi789';
    process.env.MSG91_AUTH_KEY = 'msg91_auth_jkl012';
    process.env.MSG91_WIDGET_ID = 'msg91_widget_mno345';

    assert.doesNotThrow(() => {
      validateEnv();
    });
  });
});
