import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';
import Company from '../../company/model/company.model.js';
import Customer from '../../customer/model/customer.model.js';

const Invoice = sequelize.define('Invoice', {
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
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Customer,
      key: 'id'
    }
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoice_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  customer_mobile: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Basic total if user doesn't want items
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  billing_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shipping_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Calculated fields
  gst_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  gst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  gst_price_type: {
    type: DataTypes.STRING, // 'exclusive' or 'inclusive'
    defaultValue: 'exclusive',
  },
  place_of_supply: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  taxable_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  cgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  cgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  sgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  sgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  igst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  igst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING,
    defaultValue: 'cash',
  },
  invoice_template: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'generated',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Company.hasMany(Invoice, { foreignKey: 'company_id' });
Invoice.belongsTo(Company, { foreignKey: 'company_id' });

Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });

export default Invoice;
