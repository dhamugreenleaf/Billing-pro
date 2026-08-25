import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';
import Company from '../../company/model/company.model.js';

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: Company,
      key: 'id'
    }
  },
  default_invoice_template: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
  },
  default_payment_method: {
    type: DataTypes.STRING,
    defaultValue: 'cash',
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
  },
  default_gst_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 18.0,
  },
  business_settings: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  notification_settings: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Company.hasOne(Settings, { foreignKey: 'company_id' });
Settings.belongsTo(Company, { foreignKey: 'company_id' });

export default Settings;
