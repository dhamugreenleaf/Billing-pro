import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../src/modules/product/controller/product.controller.js';
import Company from '../src/modules/company/model/company.model.js';
import Product from '../src/modules/product/model/product.model.js';
import { protect } from '../src/middleware/auth.middleware.js';

describe('Product Multi-Tenancy & Company Isolation Suite', () => {
  const originalCompanyFindOne = Company.findOne;
  const originalFindAll = Product.findAll;
  const originalFindOne = Product.findOne;
  const originalCreate = Product.create;

  // In-memory mock store for products
  const mockProducts = [];

  const companyA = { id: 101, company_name: 'Company Alpha', user_id: 1 };
  const companyB = { id: 202, company_name: 'Company Beta', user_id: 2 };
  const userNoCompany = { id: 999 };

  before(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_xyz';

    // Mock company resolution via Company.findOne
    Company.findOne = async ({ where }) => {
      if (where.user_id === 1) return companyA;
      if (where.user_id === 2) return companyB;
      return null;
    };

    // Mock Product ORM methods
    Product.create = async (data) => {
      const product = {
        id: `prod_${mockProducts.length + 1}`,
        ...data,
        update: async function (updates) {
          Object.assign(this, updates);
          return this;
        },
        destroy: async function () {
          const idx = mockProducts.findIndex(p => p.id === this.id);
          if (idx !== -1) mockProducts.splice(idx, 1);
          return true;
        }
      };
      mockProducts.push(product);
      return product;
    };

    Product.findAll = async ({ where }) => {
      return mockProducts.filter(p => {
        if (where.company_id && p.company_id !== where.company_id) return false;
        if (where.category && p.category !== where.category) return false;
        if (where.is_active !== undefined && p.is_active !== where.is_active) return false;
        return true;
      });
    };

    Product.findOne = async ({ where }) => {
      return mockProducts.find(p => {
        if (where.id && p.id !== where.id) return false;
        if (where.company_id && p.company_id !== where.company_id) return false;
        return true;
      }) || null;
    };
  });

  after(() => {
    Company.findOne = originalCompanyFindOne;
    Product.findAll = originalFindAll;
    Product.findOne = originalFindOne;
    Product.create = originalCreate;
  });

  const createMockRes = () => {
    let statusCode = 200;
    let responseData = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
      getStatusCode: () => statusCode,
      getBody: () => responseData
    };
    return res;
  };

  test('TEST 1: User from Company A creates product -> product has Company A company_id', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      body: {
        product_name: 'Widget Alpha',
        selling_price: 150,
        product_code: 'W-001',
        stock_quantity: 50
      }
    };
    const res = createMockRes();
    await createProduct(req, res);

    assert.equal(res.getStatusCode(), 201);
    const body = res.getBody();
    assert.equal(body.success, true);
    assert.equal(body.data.company_id, companyA.id);
    assert.equal(body.data.product_name, 'Widget Alpha');
  });

  test('TEST 2: User from Company A lists products -> only Company A products returned', async () => {
    // Seed a product for Company B directly
    mockProducts.push({
      id: 'prod_beta_1',
      company_id: companyB.id,
      product_name: 'Widget Beta',
      selling_price: 250,
      product_code: 'WB-001',
      update: async () => {},
      destroy: async () => {}
    });

    const req = {
      user: { id: 1, role: 'customer' },
      query: {}
    };
    const res = createMockRes();
    await getProducts(req, res);

    assert.equal(res.getStatusCode(), 200);
    const body = res.getBody();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    // Must contain Company A products and NOT Company B products
    assert.ok(body.data.every(p => p.company_id === companyA.id));
    assert.ok(body.data.some(p => p.product_name === 'Widget Alpha'));
    assert.ok(!body.data.some(p => p.product_name === 'Widget Beta'));
  });

  test('TEST 3: User from Company A requests Company A product by ID -> returns product', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      params: { id: 'prod_1' }
    };
    const res = createMockRes();
    await getProductById(req, res);

    assert.equal(res.getStatusCode(), 200);
    const body = res.getBody();
    assert.equal(body.success, true);
    assert.equal(body.data.id, 'prod_1');
    assert.equal(body.data.company_id, companyA.id);
  });

  test('TEST 4: User from Company A requests Company B product ID -> 404 Not Found', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      params: { id: 'prod_beta_1' } // belongs to Company B
    };
    const res = createMockRes();
    await getProductById(req, res);

    assert.equal(res.getStatusCode(), 404);
    const body = res.getBody();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Product not found');
  });

  test('TEST 5: User from Company A tries to update Company B product -> 404 Rejected', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      params: { id: 'prod_beta_1' },
      body: { selling_price: 999 }
    };
    const res = createMockRes();
    await updateProduct(req, res);

    assert.equal(res.getStatusCode(), 404);
    const body = res.getBody();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Product not found');
  });

  test('TEST 6: User from Company A tries to delete Company B product -> 404 Rejected', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      params: { id: 'prod_beta_1' }
    };
    const res = createMockRes();
    await deleteProduct(req, res);

    assert.equal(res.getStatusCode(), 404);
    const body = res.getBody();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Product not found');
  });

  test('TEST 7: Frontend sends fake company_id in body -> ignored, assigned to authenticated user company', async () => {
    const req = {
      user: { id: 1, role: 'customer' },
      body: {
        product_name: 'Spoofed Company Product',
        selling_price: 200,
        company_id: 999999 // Attacker tries to inject company_id
      }
    };
    const res = createMockRes();
    await createProduct(req, res);

    assert.equal(res.getStatusCode(), 201);
    const body = res.getBody();
    assert.equal(body.success, true);
    // Must be assigned to Company A, NEVER 999999
    assert.equal(body.data.company_id, companyA.id);
    assert.notEqual(body.data.company_id, 999999);
  });

  test('TEST 8: User with no company attempts product creation -> 400 Safe error response', async () => {
    const req = {
      user: { id: 999, role: 'customer' }, // has no company
      body: {
        product_name: 'Orphan Product',
        selling_price: 300
      }
    };
    const res = createMockRes();
    await createProduct(req, res);

    assert.equal(res.getStatusCode(), 400);
    const body = res.getBody();
    assert.equal(body.success, false);
    assert.match(body.message, /Company.*not found/i);
  });

  test('TEST 9: User with invalid/missing token rejected by auth middleware -> 401', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid_token_abc' }
    };
    let nextCalled = false;
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

    protect(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'protect middleware must NOT call next() on invalid token');
    assert.equal(statusCode, 401);
    assert.equal(resBody.success, false);
  });

  test('TEST 10: Two companies with identical product SKU/name -> isolated view per company', async () => {
    // Company A creates SKU-COMMON
    const reqA = {
      user: { id: 1, role: 'customer' },
      body: { product_name: 'Universal Battery', product_code: 'SKU-COMMON', selling_price: 50 }
    };
    const resA = createMockRes();
    await createProduct(reqA, resA);
    assert.equal(resA.getStatusCode(), 201);

    // Company B creates SKU-COMMON
    const reqB = {
      user: { id: 2, role: 'customer' },
      body: { product_name: 'Universal Battery', product_code: 'SKU-COMMON', selling_price: 75 }
    };
    const resB = createMockRes();
    await createProduct(reqB, resB);
    assert.equal(resB.getStatusCode(), 201);

    // Company A lists
    const listResA = createMockRes();
    await getProducts({ user: { id: 1 }, query: {} }, listResA);
    const prodsA = listResA.getBody().data;
    const matchA = prodsA.filter(p => p.product_code === 'SKU-COMMON');
    assert.equal(matchA.length, 1);
    assert.equal(matchA[0].company_id, companyA.id);
    assert.equal(matchA[0].selling_price, 50);

    // Company B lists
    const listResB = createMockRes();
    await getProducts({ user: { id: 2 }, query: {} }, listResB);
    const prodsB = listResB.getBody().data;
    const matchB = prodsB.filter(p => p.product_code === 'SKU-COMMON');
    assert.equal(matchB.length, 1);
    assert.equal(matchB[0].company_id, companyB.id);
    assert.equal(matchB[0].selling_price, 75);
  });
});
