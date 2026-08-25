import * as invoiceService from '../services/invoice.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { createInvoiceSchema } from '../zod/invoice.zod.js';

export const createInvoice = async (req, res, next) => {
  try {
    const validatedData = createInvoiceSchema.parse({ body: req.body });
    const invoice = await invoiceService.generateInvoice(req.user.id, validatedData.body);
    return sendSuccess(res, 'Invoice generated successfully', invoice, 201);
  } catch (error) {
    next(error);
  }
};

export const getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await invoiceService.getInvoices(req.user.id);
    return sendSuccess(res, 'Invoices retrieved successfully', invoices);
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceDetails(req.user.id, req.params.id);
    return sendSuccess(res, 'Invoice retrieved successfully', invoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    if (!template) {
      throw { statusCode: 400, message: 'Template is required' };
    }
    const invoice = await invoiceService.updateTemplate(req.user.id, req.params.id, template);
    return sendSuccess(res, 'Invoice template updated successfully', invoice);
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    await invoiceService.deleteInvoice(req.user.id, req.params.id);
    return sendSuccess(res, 'Invoice deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
