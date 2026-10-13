import * as subService from '../modules/subscription/services/subscription.service.js';
import InvoiceFormat from '../modules/invoice/model/invoiceFormat.model.js';

const planLevels = { 'Free': 1, 'Basic': 2, 'Pro': 3, 'Enterprise': 4 };

export const requireInvoiceFormat = async (req, res, next) => {
  try {
    // TEMPORARY: Allow all invoice formats for testing process
    return next();

    // Admin users have access to all templates
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const { template } = req.body;
    if (!template) {
      return next(); // Pass to controller validation
    }

    const templateIdentifier = template === 'normal' ? 'standard' : template;
    const format = await InvoiceFormat.findOne({ where: { template_identifier: templateIdentifier } });
    if (!format) {
      return next(); // Or throw error
    }

    const requiredLevel = planLevels[format.required_plan] || 1;

    const sub = await subService.getCurrentSubscription(req.user.id);
    const planName = sub && sub.Plan ? sub.Plan.name : 'Free';
    const currentLevel = planLevels[planName] || 1;

    if (currentLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `This invoice format requires the ${format.required_plan} plan.`
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
