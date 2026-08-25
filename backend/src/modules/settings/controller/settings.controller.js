import * as settingsService from '../services/settings.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { updateSettingsSchema } from '../zod/settings.zod.js';

export const getGlobalSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getGlobalSettings();
    return sendSuccess(res, 'Global Settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.user.id);
    return sendSuccess(res, 'Settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const validatedData = updateSettingsSchema.parse({ body: req.body });
    const settings = await settingsService.updateSettings(req.user.id, validatedData.body);
    return sendSuccess(res, 'Settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};
