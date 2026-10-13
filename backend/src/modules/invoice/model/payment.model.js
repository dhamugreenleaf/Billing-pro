import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';
import Invoice from './invoice.model.js';
import Company from '../../company/model/company.model.js';

/**
 * Payment – records individual payment transactions applied to an invoice.
 *
 * One invoice can have MULTIPLE Payment rows (e.g. partial payments).
 * The sum of payment.amount for an invoice = invoice.paid_amount.
 *
 * payment_reference is used for idempotency:
 *   - Razorpay: razorpay_payment_id
 *   - UPI: UPI transaction reference
 *   - Cash/Card: null (no external reference)
 *
 * Duplicate protection: unique index on (invoice_id, payment_reference)
 * when payment_reference is non-null prevents double-counting the same
 * external transaction.
 */
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Company,
      key: 'id'
    }
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Invoice,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    // 'cash' | 'upi' | 'card' | 'bank_transfer' | 'razorpay' | etc.
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_reference: {
    // External reference: razorpay_payment_id, UPI txn id, etc.
    // null for cash payments which have no external reference
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'invoice_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      // Prevent double-counting the same external payment reference per invoice
      unique: true,
      fields: ['invoice_id', 'payment_reference'],
      name: 'payments_invoice_reference_unique',
      where: {
        payment_reference: {
          [Symbol.for('ne')]: null
        }
      }
    }
  ]
});

Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Company.hasMany(Payment, { foreignKey: 'company_id' });
Payment.belongsTo(Company, { foreignKey: 'company_id' });

export default Payment;
