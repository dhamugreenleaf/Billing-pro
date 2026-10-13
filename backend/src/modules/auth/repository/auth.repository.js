import { Op } from 'sequelize';
import User from '../model/auth.model.js';

export const findUserByMobile = async (mobile_number) => {
  const cleanNumber = String(mobile_number).replace(/\D/g, '').slice(-10);
  const user = await User.findOne({
    where: {
      mobile_number: {
        [Op.in]: [cleanNumber, `91${cleanNumber}`, `+91${cleanNumber}`]
      }
    }
  });
  if (user && user.mobile_number !== cleanNumber) {
    user.mobile_number = cleanNumber;
    await user.save().catch(() => {});
  }
  return user;
};

export const findUserByMobileAndRole = async (mobile_number, role) => {
  const cleanNumber = String(mobile_number).replace(/\D/g, '').slice(-10);
  const user = await User.findOne({
    where: {
      mobile_number: {
        [Op.in]: [cleanNumber, `91${cleanNumber}`, `+91${cleanNumber}`]
      },
      role
    }
  });
  if (user && user.mobile_number !== cleanNumber) {
    user.mobile_number = cleanNumber;
    await user.save().catch(() => {});
  }
  return user;
};

export const findUserByUsername = async (username) => {
  return await User.findOne({ where: { username } });
};

export const findUserById = async (id) => {
  return await User.findByPk(id);
};

export const createUser = async (userData) => {
  return await User.create(userData);
};
