import User from '../model/auth.model.js';

export const findUserByMobile = async (mobile_number) => {
  return await User.findOne({ where: { mobile_number } });
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
