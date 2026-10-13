import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import authRoutes from '../src/modules/auth/auth.routes.js';
import { testLogin, verifyMsg91 } from '../src/modules/auth/controller/auth.controller.js';
import User from '../src/modules/auth/model/auth.model.js';

describe('Test Login Production Disablement Suite', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFetch = global.fetch;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  const mockUsers = new Map();

  before(() => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test_jwt_secret_xyz';
    process.env.MSG91_AUTH_KEY = 'mock_msg91_key';
    process.env.MSG91_WIDGET_ID = 'mock_widget_id';

    User.findOne = async ({ where }) => {
      const mobile = where?.mobile_number;
      const role = where?.role;
      return mockUsers.get(`${mobile}_${role}`) || null;
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
    process.env.NODE_ENV = originalNodeEnv;
    global.fetch = originalFetch;
    User.findOne = originalFindOne;
    User.create = originalCreate;
  });

  const makeTestLoginRequest = async (body, env = 'production') => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = env;

    return new Promise((resolve) => {
      const req = { body };
      let statusCode = 200;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          process.env.NODE_ENV = prevEnv;
          resolve({ status: statusCode, body: data });
        }
      };

      testLogin(req, res, (err) => {
        process.env.NODE_ENV = prevEnv;
        resolve({ status: err?.statusCode || 500, body: { success: false, message: err?.message } });
      });
    });
  };

  test('TEST 1: Production environment + /api/auth/test-login -> 404', async () => {
    const res = await makeTestLoginRequest({ username: 'sanjay', password: 'password123' }, 'production');

    assert.equal(res.status, 404, 'Must return HTTP 404 in production');
    assert.equal(res.body.success, false);
    assert.ok(!res.body.token, 'Must never return a token');
  });

  test('TEST 2: Production + fake phone number -> No JWT, 404', async () => {
    const res = await makeTestLoginRequest({
      username: 'sanjay',
      password: 'password123',
      phone: '9999999999'
    }, 'production');

    assert.equal(res.status, 404);
    assert.ok(!res.body.token);
    assert.ok(!res.body.data?.token);
  });

  test('TEST 3: Production + admin phone -> No admin JWT, 404', async () => {
    const res = await makeTestLoginRequest({
      username: 'admin',
      password: 'password123',
      phone: '9876543210',
      role: 'admin'
    }, 'production');

    assert.equal(res.status, 404);
    assert.ok(!res.body.token);
    assert.ok(!res.body.data?.token);
  });

  test('TEST 4: Production + fake company_id -> No authentication, 404', async () => {
    const res = await makeTestLoginRequest({
      username: 'sanjay',
      password: 'password123',
      company_id: 12345
    }, 'production');

    assert.equal(res.status, 404);
    assert.ok(!res.body.token);
  });

  test('TEST 5: Production + fake role=admin -> No authentication, 404', async () => {
    const res = await makeTestLoginRequest({
      username: 'sanjay',
      password: 'password123',
      role: 'admin'
    }, 'production');

    assert.equal(res.status, 404);
    assert.ok(!res.body.token);
  });

  test('TEST 6: Normal MSG91 OTP login in production -> Still works normally', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({
        type: 'success',
        mobile: '919876543210'
      })
    });

    const req = {
      body: {
        identifier: '9876543210',
        accessToken: 'valid_prod_token_test_123',
        loginType: 'user'
      }
    };

    let statusCode = 200;
    let resBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resBody = data;
        return this;
      }
    };

    await verifyMsg91(req, res, () => {});

    assert.equal(statusCode, 200);
    assert.equal(resBody.success, true);
    assert.ok(resBody.data?.token, 'Must issue a valid token via MSG91 OTP');
    assert.equal(resBody.data?.user?.mobile_number, '9876543210');
  });

  test('TEST 7: Normal user login -> profile and session issued correctly', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({
        type: 'success',
        mobile: '919111122222'
      })
    });

    const req = {
      body: {
        identifier: '9111122222',
        accessToken: 'user_otp_token_xyz',
        loginType: 'user'
      }
    };

    let statusCode = 200;
    let resBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resBody = data;
        return this;
      }
    };

    await verifyMsg91(req, res, () => {});

    assert.equal(statusCode, 200);
    assert.equal(resBody.data.user.role, 'customer');
  });

  test('TEST 8: Router check in production -> test-login route is not registered', async () => {
    // When NODE_ENV === 'production', the route stack should NOT contain /test-login
    process.env.NODE_ENV = 'production';
    const prodAuthRoutes = (await import(`../src/modules/auth/auth.routes.js?t=${Date.now()}`)).default;
    const routes = prodAuthRoutes.stack.map(layer => layer.route?.path).filter(Boolean);
    assert.ok(!routes.includes('/test-login'), '/test-login route must NOT be registered in production route stack');
  });
});
