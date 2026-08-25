import * as settingsRepo from '../repository/settings.repository.js';
import * as companyService from '../../company/services/company.service.js';
import AdminSettings from '../../admin/model/adminSettings.model.js';

export const getGlobalSettings = async () => {
  let adminSettings = await AdminSettings.findByPk(1);
  if (!adminSettings) {
    adminSettings = { 
      default_invoice_format: 'standard', 
      default_gst_rate: 18.0,
      gst_settings: {
        availableGstRates: [
          { rate: 5, enabled: true },
          { rate: 12, enabled: true },
          { rate: 18, enabled: true },
          { rate: 28, enabled: true }
        ]
      }
    };
  }
  return adminSettings;
};

export const getSettings = async (user_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) throw { statusCode: 400, message: 'Company profile required' };

  let settings = await settingsRepo.findSettingsByCompanyId(company.id);

  if (!settings) {
    settings = await settingsRepo.createSettings({ company_id: company.id });
  }

  return settings;
};

export const updateSettings = async (user_id, settingsData) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) throw { statusCode: 400, message: 'Company profile required' };

  let settings = await settingsRepo.findSettingsByCompanyId(company.id);

  if (!settings) {
    return await settingsRepo.createSettings({ ...settingsData, company_id: company.id });
  }

  return await settingsRepo.updateSettings(company.id, settingsData);
};
