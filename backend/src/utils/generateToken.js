import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.js';

export const generateToken = (id, companyId, role) => {
  return jwt.sign({ id, company_id: companyId, role }, getJwtSecret(), {
    expiresIn: '30d',
  });
};
