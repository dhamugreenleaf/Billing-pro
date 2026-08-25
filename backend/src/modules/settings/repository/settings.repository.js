import Settings from '../model/settings.model.js';

export const findSettingsByCompanyId = async (company_id) => {
  return await Settings.findOne({ where: { company_id } });
};

export const createSettings = async (settingsData) => {
  return await Settings.create(settingsData);
};

export const updateSettings = async (company_id, settingsData) => {
  await Settings.update(settingsData, { where: { company_id } });
  return await findSettingsByCompanyId(company_id);
};
