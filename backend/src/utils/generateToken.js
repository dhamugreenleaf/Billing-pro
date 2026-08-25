import jwt from 'jsonwebtoken';

export const generateToken = (id, companyId, role) => {
  return jwt.sign({ id, company_id: companyId, role }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};
