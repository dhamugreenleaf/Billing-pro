import Settings from '../model/settings.model.js';

export const findSettingsByCompanyId = async (company_id) => {
  return await Settings.findOne({ where: { company_id } });
};

export const createSettings = async (settingsData) => {
  try {
    return await Settings.create(settingsData);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' && settingsData.company_id) {
      return await findSettingsByCompanyId(settingsData.company_id);
    }
    throw err;
  }
};

export const updateSettings = async (company_id, settingsData) => {
  await Settings.update(settingsData, { where: { company_id } });
  return await findSettingsByCompanyId(company_id);
};
