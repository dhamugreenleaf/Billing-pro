import express from 'express';
import { getSettings, updateSettings, getGlobalSettings } from './controller/settings.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/global', getGlobalSettings);

router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
