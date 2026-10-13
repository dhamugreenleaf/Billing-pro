import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { verifyMsg91, sendOtp, resendOtp } from '../src/modules/auth/controller/auth.controller.js';
import { sendMsg91Otp, resendMsg91Otp } from '../src/modules/auth/services/auth.service.js';
import * as authRepo from '../src/modules/auth/repository/auth.repository.js';

// Setup Express test app with the actual verifyMsg91 controller
const app = express();
app.use(express.json());
app.post('/api/auth/verify-msg91', verifyMsg91);

// Mock DB users store for testing
const mockUsers = new Map();

// Helper to simulate HTTP requests without external server
const makeRequest = async (body) => {
  return new Promise((resolve) => {
    const req = { body };
    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resolve({ status: statusCode, body: data });
      }
    };
    verifyMsg91(req, res, (err) => {
      resolve({ status: err?.statusCode || 500, body: { success: false, message: err?.message, code: err?.code } });
    });
  });
};

import User from '../src/modules/auth/model/auth.model.js';

describe('MSG91 OTP Verification Suite', () => {
  const originalFetch = global.fetch;
  const originalAuthKey = process.env.MSG91_AUTH_KEY;
  const originalWidgetId = process.env.MSG91_WIDGET_ID;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  before(() => {
    process.env.MSG91_AUTH_KEY = 'mock_msg91_auth_key_test_12345';
    process.env.MSG91_WIDGET_ID = 'mock_msg91_widget_id_67890';
    process.env.NODE_ENV = 'production'; // Force real flow

    // Mock User Model methods
    User.findOne = async ({ where }) => {
      const mobile_number = where?.mobile_number?.[Object.getOwnPropertySymbols(where.mobile_number)[0]]?.[0] || where?.mobile_number;
      const role = where?.role;
      return mockUsers.get(`${mobile_number}_${role}`) || null;
    };

    User.create = async (data) => {
      const user = {
        id: Math.floor(Math.random() * 10000) + 1,
        mobile_number: data.mobile_number,
        name: data.name,
        role: data.role,
        profile_completed: false,
        is_deleted: false,
        terms_accepted_at: null,
        save: async () => user
      };
      mockUsers.set(`${data.mobile_number}_${data.role}`, user);
      return user;
    };
  });

  after(() => {
    global.fetch = originalFetch;
    process.env.MSG91_AUTH_KEY = originalAuthKey;
    process.env.MSG91_WIDGET_ID = originalWidgetId;
    User.findOne = originalFindOne;
    User.create = originalCreate;
  });

  test('1. Happy Path: Valid access token returns 200 with JWT and user profile', async () => {
    let outboundCalled = false;
    let outboundBody = null;

    global.fetch = async (url, options) => {
      outboundCalled = true;
      outboundBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          type: 'success',
          mobile: '919876543210'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'valid_access_token_abc_123',
      loginType: 'user'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token, 'Should return JWT token');
    assert.equal(res.body.data.user.mobile_number, '9876543210');
    assert.equal(outboundCalled, true);
    assert.deepEqual(outboundBody, { 'access-token': 'valid_access_token_abc_123' });
  });

  test('2. Server Idempotency: Duplicate request with same token returns 200 from cache', async () => {
    let outboundCalls = 0;

    global.fetch = async () => {
      outboundCalls++;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          type: 'success',
          mobile: '919876543210'
        })
      };
    };

    // First call
    const res1 = await makeRequest({
      identifier: '9876543210',
      accessToken: 'idempotent_token_test_999',
      loginType: 'user'
    });
    assert.equal(res1.status, 200);
    assert.equal(outboundCalls, 1);

    // Second duplicate call (with same accessToken)
    const res2 = await makeRequest({
      identifier: '9876543210',
      accessToken: 'idempotent_token_test_999',
      loginType: 'user'
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.user.id, res1.body.data.user.id);
    // Should NOT call MSG91 again (served from in-memory cache)
    assert.equal(outboundCalls, 1, 'Duplicate token must NOT hit MSG91 outbound API again');
  });

  test('3. Error Handling: Expired token returns clean 400 (NO 500)', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({
          type: 'error',
          message: 'access-token expired'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'expired_token_test_001',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500, 'Must NEVER return 500 on expired token');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'OTP_EXPIRED');
    assert.match(res.body.message, /expired/i);
  });

  test('4. Error Handling: Invalid token returns clean 400 (NO 500)', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({
          type: 'error',
          message: 'Invalid access token'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'invalid_token_test_002',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500, 'Must NEVER return 500 on invalid token');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'OTP_INVALID');
    assert.match(res.body.message, /invalid/i);
  });

  test('5. Error Handling: MSG91 Network Timeout aborts within timeout and returns 408 (NO 500)', async () => {
    global.fetch = async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'timeout_token_test_003',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500, 'Must NEVER return 500 on network timeout');
    assert.equal(res.status, 408);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'MSG91_TIMEOUT');
    assert.match(res.body.message, /timed out/i);
  });

  test('6. Error Handling: Malformed / non-JSON response returns clean 400 (NO 500)', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => '<html><body>502 Bad Gateway from Cloudflare</body></html>'
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'malformed_token_test_004',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500, 'Must NEVER return 500 on malformed response');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'MSG91_MALFORMED');
  });

  test('7. Security: Mobile number mismatch returns clean 400 (NO 500)', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          type: 'success',
          mobile: '911234567890' // Different number than requested 9876543210
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'mismatch_token_test_005',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'MOBILE_MISMATCH');
    assert.match(res.body.message, /does not match/i);
  });

  test('8. Provider Already Verified: Bypasses duplicate provider error and retrieves user', async () => {
    // Seed user in mock store first
    mockUsers.set('9876543210_customer', {
      id: 888,
      mobile_number: '9876543210',
      name: 'Existing Customer',
      role: 'customer',
      profile_completed: true,
      is_deleted: false,
      terms_accepted_at: new Date()
    });

    global.fetch = async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          type: 'error',
          message: 'access-token already verified'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: 'already_verified_token_006',
      loginType: 'user'
    });

    assert.notEqual(res.status, 500, 'Must not crash or 500 when already verified');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.id, 888);
  });

  test('9. Direct Numeric OTP: 4-digit code verifies directly with MSG91 and logs in', async () => {
    let directCalled = false;
    let requestedUrl = '';

    global.fetch = async (url) => {
      directCalled = true;
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          type: 'success',
          message: 'OTP verified success'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: '4567',
      loginType: 'user'
    });

    assert.equal(directCalled, true, 'Must call direct OTP verify endpoint');
    assert.match(requestedUrl, /otp\/verify\?otp=4567&mobile=919876543210/);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
  });

  test('10. Direct Numeric OTP: Invalid 4-digit code returns clean 400', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          type: 'error',
          message: 'OTP not match'
        })
      };
    };

    const res = await makeRequest({
      identifier: '9876543210',
      accessToken: '0000',
      loginType: 'user'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid otp/i);
  });

  test('11. OTP Submission: sendMsg91Otp succeeds and returns requestId', async () => {
    let requestedUrl = '';
    let usedAuthKey = '';

    global.fetch = async (url, options) => {
      requestedUrl = url;
      usedAuthKey = options?.headers?.authkey;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'success',
          message: 'OTP sent successfully',
          request_id: 'msg91_req_test_111'
        })
      };
    };

    const result = await sendMsg91Otp('9876543210');
    assert.equal(result.success, true);
    assert.equal(result.requestId, 'msg91_req_test_111');
    assert.match(requestedUrl, /otp\?mobile=919876543210&otp_length=4/);
    assert.equal(usedAuthKey, 'mock_msg91_auth_key_test_12345');
  });

  test('12. OTP Submission: Provider rejection returns clean 400 error', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          type: 'error',
          message: 'Number is blacklisted or invalid'
        })
      };
    };

    await assert.rejects(
      async () => await sendMsg91Otp('9876543210'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /blacklisted or invalid/i);
        return true;
      }
    );
  });

  test('13. OTP Resend: resendMsg91Otp succeeds and returns requestId', async () => {
    let requestedUrl = '';

    global.fetch = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'success',
          message: 'OTP resent successfully',
          request_id: 'msg91_req_test_222'
        })
      };
    };

    const result = await resendMsg91Otp('9876543210');
    assert.equal(result.success, true);
    assert.equal(result.requestId, 'msg91_req_test_222');
    assert.match(requestedUrl, /otp\?mobile=919876543210&otp_length=4&retrytype=text/);
  });

  test('14. OTP Resend: Provider rejection returns clean 400 error', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          type: 'error',
          message: 'Too many retry attempts'
        })
      };
    };

    await assert.rejects(
      async () => await resendMsg91Otp('9876543210'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Too many retry attempts/i);
        return true;
      }
    );
  });

  test('15. Safe Logging: Secrets, API keys, and sensitive tokens are NEVER logged in cleartext', async () => {
    const originalLog = console.log;
    const originalError = console.error;
    const capturedLogs = [];

    console.log = (...args) => capturedLogs.push(args.join(' '));
    console.error = (...args) => capturedLogs.push(args.join(' '));

    try {
      global.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => JSON.stringify({
            type: 'success',
            mobile: '919876543210'
          })
        };
      };

      const secretToken = 'super_secret_jwt_access_token_xyz_999';
      await makeRequest({
        identifier: '9876543210',
        accessToken: secretToken,
        loginType: 'user'
      });

      const joinedLogs = capturedLogs.join('\n');
      assert.equal(joinedLogs.includes(secretToken), false, 'Raw accessToken must NOT appear in logs');
      assert.equal(joinedLogs.includes(process.env.MSG91_AUTH_KEY), false, 'MSG91_AUTH_KEY must NOT appear in logs');
      assert.match(joinedLogs, /\[REDACTED\]/, 'Sensitive fields should be redacted');
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  });
});
