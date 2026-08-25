import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';
import Company from '../../company/model/company.model.js';

const Customer = sequelize.define('Customer', {
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
  mobile_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// A company has many customers, and customers are scoped to a company
Company.hasMany(Customer, { foreignKey: 'company_id' });
Customer.belongsTo(Company, { foreignKey: 'company_id' });

export default Customer;
