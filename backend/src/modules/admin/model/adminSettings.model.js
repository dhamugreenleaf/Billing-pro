import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

const AdminSettings = sequelize.define('AdminSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1, // Enforce single row
  },
  default_invoice_format: {
    type: DataTypes.STRING,
    defaultValue: 'standard',
  },
  default_gst_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 18.0,
  },
  tally_format: {
    type: DataTypes.STRING,
    defaultValue: 'default',
  },
  system_name: {
    type: DataTypes.STRING,
    defaultValue: 'Billing Pro',
  },
  gst_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      availableGstRates: [
        { rate: 5, enabled: true },
        { rate: 12, enabled: true },
        { rate: 18, enabled: true },
        { rate: 28, enabled: true }
      ]
    }
  }
}, {
  tableName: 'admin_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default AdminSettings;
