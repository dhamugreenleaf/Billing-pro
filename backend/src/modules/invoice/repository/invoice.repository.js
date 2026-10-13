import { Op } from 'sequelize';
import sequelize from '../../../config/db.js';
import Invoice from '../model/invoice.model.js';
import InvoiceItem from '../model/invoiceItem.model.js';
import Company from '../../company/model/company.model.js';
import Customer from '../../customer/model/customer.model.js';
import Payment from '../model/payment.model.js';
import Product from '../../product/model/product.model.js';

export const formatInvoiceNumber = (prefix, sequenceNumber) => {
  const paddedCount = String(sequenceNumber).padStart(6, '0');
  return `${prefix}-${paddedCount}`;
};

/**
 * Creates an invoice atomically with a concurrency-safe company-scoped invoice number
 * and transactional, concurrency-safe product stock decrement.
 *
 * Concurrency & Transactional Safety Mechanism:
 * 1. Wraps entire creation in a single database transaction.
 * 2. Validates authenticated company.
 * 3. Resolves and validates all invoice items.
 * 4. Locks required product rows via `SELECT ... FOR UPDATE` (or advisory lock) in deterministic order
 *    to prevent deadlocks and race conditions.
 * 5. Strictly isolates multi-tenancy: product MUST belong to authenticated company_id.
 * 6. Validates stock availability for inventory products (services/non-stock products exempt).
 * 7. Acquires PostgreSQL transaction-level advisory lock specific to company_id to serialize numbering.
 * 8. Creates invoice and invoice items.
 * 9. Decrements product stock atomically inside the transaction.
 * 10. Automatically rolls back ALL operations if any validation, lock, insertion, or decrement fails.
 */
export const createInvoice = async (invoiceData, itemsData) => {
  const companyId = invoiceData.company_id;
  if (!companyId) {
    throw { statusCode: 400, message: 'Authenticated company_id is required.' };
  }

  const prefix = invoiceData._invoice_prefix || 'INV';
  delete invoiceData._invoice_prefix;

  return await sequelize.transaction(async (t) => {
    // 1. Resolve product associations & aggregate quantities per product
    const productTotals = new Map();
    const resolvedItems = itemsData ? [...itemsData] : [];

    for (const item of resolvedItems) {
      let productId = item.product_id;

      // Fallback: If product_id was not directly provided but product_code was
      if (!productId && item.product_code) {
        const productByCode = await Product.findOne({
          where: { product_code: item.product_code, company_id: companyId },
          transaction: t
        });
        if (productByCode) {
          productId = productByCode.id;
          item.product_id = productByCode.id;
        }
      }

      if (productId) {
        const qty = Number(item.quantity) || 1;
        if (qty <= 0) {
          throw { statusCode: 400, message: 'Item quantity must be greater than zero.' };
        }
        productTotals.set(productId, (productTotals.get(productId) || 0) + qty);
      }
    }

    // 2. Lock required product rows & validate multi-tenant ownership + stock availability
    // Sort product IDs deterministically to avoid deadlocks across concurrent requests
    const sortedProductIds = Array.from(productTotals.keys()).sort();
    const productsToDecrement = [];

    for (const productId of sortedProductIds) {
      const product = await Product.findOne({
        where: { id: productId },
        lock: t.LOCK ? t.LOCK.UPDATE : true,
        transaction: t
      });

      if (!product) {
        throw { statusCode: 404, message: `Product ${productId} not found.` };
      }

      // Multi-tenant check: Product MUST belong to the authenticated company
      if (product.company_id !== companyId) {
        throw {
          statusCode: 403,
          message: `Product "${product.product_name || productId}" does not belong to your company.`
        };
      }

      // Check if non-stock / service item (services do not track inventory stock)
      const isService = product.category && ['service', 'services'].includes(String(product.category).toLowerCase().trim());
      if (!isService) {
        const needed = productTotals.get(productId);
        if (product.stock_quantity < needed) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for product "${product.product_name}". Available: ${product.stock_quantity}, requested: ${needed}`
          };
        }
        productsToDecrement.push({ product, productId, totalNeeded: needed });
      }
    }

    // 3. Acquire transaction-level advisory lock specific to this company for invoice numbering.
    if (sequelize.getDialect() === 'postgres') {
      await sequelize.query(
        'SELECT pg_advisory_xact_lock(1230263247, :companyId);',
        {
          replacements: { companyId },
          transaction: t,
          type: sequelize.QueryTypes.SELECT
        }
      );
    }

    // 4. Derive next sequence number safely within the locked transaction
    let nextSeq = 1;
    if (sequelize.getDialect() === 'postgres') {
      const [res] = await sequelize.query(`
        SELECT COALESCE(
          MAX(
            CASE 
              WHEN invoice_number ~ '-[0-9]+$' 
              THEN (regexp_match(invoice_number, '-([0-9]+)$'))[1]::INTEGER 
              ELSE 0 
            END
          ), 0
        ) as max_seq
        FROM invoices
        WHERE company_id = :companyId;
      `, {
        replacements: { companyId },
        transaction: t
      });

      const currentMax = (res && res[0] && res[0].max_seq !== undefined) ? parseInt(res[0].max_seq, 10) : 0;
      nextSeq = currentMax + 1;
    } else {
      // Fallback for non-postgres test environments
      const count = await Invoice.count({ where: { company_id: companyId }, transaction: t });
      nextSeq = count + 1;
    }

    const assignedInvoiceNumber = formatInvoiceNumber(prefix, nextSeq);
    const invoiceToSave = {
      ...invoiceData,
      invoice_number: assignedInvoiceNumber
    };

    // 5. Create invoice
    const invoice = await Invoice.create(invoiceToSave, { transaction: t });

    // 6. Create invoice items
    if (resolvedItems && resolvedItems.length > 0) {
      const itemsToCreate = resolvedItems.map(item => ({
        ...item,
        invoice_id: invoice.id
      }));
      await InvoiceItem.bulkCreate(itemsToCreate, { transaction: t });
    }

    // 7. Decrement stock for tracked products
    for (const { productId, totalNeeded } of productsToDecrement) {
      await Product.decrement('stock_quantity', {
        by: totalNeeded,
        where: { id: productId, company_id: companyId },
        transaction: t
      });
    }

    // 8. If initial payment was made during creation, record it in invoice_payments
    if (parseFloat(invoice.paid_amount) > 0) {
      await Payment.create({
        company_id: companyId,
        invoice_id: invoice.id,
        amount: parseFloat(invoice.paid_amount),
        payment_method: invoice.payment_method || 'cash',
        payment_reference: invoiceData.payment_reference || null,
        notes: invoiceData.payment_notes || 'Initial payment on creation'
      }, { transaction: t });
    }

    return await Invoice.findByPk(invoice.id, {
      include: [
        { model: InvoiceItem, as: 'items' },
        { model: Payment, as: 'payments' }
      ],
      transaction: t
    });
  });
};

export const getInvoicesByCompany = async (company_id) => {
  return await Invoice.findAll({ 
    where: { company_id },
    order: [['created_at', 'DESC']]
  });
};

export const getInvoiceById = async (id, company_id) => {
  return await Invoice.findOne({
    where: { id, company_id },
    include: [
      {
        model: InvoiceItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      },
      { model: Company },
      { model: Customer },
      { model: Payment, as: 'payments' }
    ]
  });
};

export const countInvoicesByCompany = async (company_id) => {
  return await Invoice.count({ where: { company_id } });
};

export const countInvoicesForCurrentMonth = async (company_id) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  return await Invoice.count({
    where: {
      company_id,
      created_at: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    }
  });
};

export const updateInvoiceTemplate = async (id, company_id, template) => {
  const invoice = await Invoice.findOne({ where: { id, company_id } });
  if (invoice) {
    invoice.invoice_template = template;
    await invoice.save();
  }
  return invoice;
};

/**
 * Deletes an invoice and safely restores / reverses the stock for tracked products.
 */
export const deleteInvoice = async (id, company_id) => {
  return await sequelize.transaction(async (t) => {
    // 1. Fetch invoice and its items
    const invoice = await Invoice.findOne({
      where: { id, company_id },
      include: [{ model: InvoiceItem, as: 'items' }],
      transaction: t
    });

    if (!invoice) {
      return false;
    }

    // 2. Identify products to restore
    if (invoice.items && invoice.items.length > 0) {
      const productTotals = new Map();
      for (const item of invoice.items) {
        if (item.product_id) {
          const qty = Number(item.quantity) || 1;
          productTotals.set(item.product_id, (productTotals.get(item.product_id) || 0) + qty);
        }
      }

      const sortedProductIds = Array.from(productTotals.keys()).sort();
      for (const productId of sortedProductIds) {
        const product = await Product.findOne({
          where: { id: productId, company_id },
          lock: t.LOCK ? t.LOCK.UPDATE : true,
          transaction: t
        });

        if (product) {
          const isService = product.category && ['service', 'services'].includes(String(product.category).toLowerCase().trim());
          if (!isService) {
            const qtyToRestore = productTotals.get(productId);
            await Product.increment('stock_quantity', {
              by: qtyToRestore,
              where: { id: productId, company_id },
              transaction: t
            });
          }
        }
      }
    }

    // 3. Destroy invoice (cascades to invoice_items)
    const result = await Invoice.destroy({ where: { id, company_id }, transaction: t });
    return result > 0;
  });
};


