import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

const InvoiceFormat = sequelize.define('InvoiceFormat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  template_identifier: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  required_plan: {
    type: DataTypes.STRING, // E.g., 'Free', 'Basic', 'Pro'
    defaultValue: 'Free',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  }
}, {
  tableName: 'invoice_formats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default InvoiceFormat;
