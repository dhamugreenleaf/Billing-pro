import * as invoiceRepo from '../repository/invoice.repository.js';
import * as customerService from '../../customer/services/customer.service.js';
import * as companyService from '../../company/services/company.service.js';
import * as subService from '../../subscription/services/subscription.service.js';
import AdminSettings from '../../admin/model/adminSettings.model.js';
import { determineGstClassification, calculateGstSplit, roundTo2Decimals, getStateFromGstin } from '../../../utils/gstState.js';
import { derivePaymentStatus } from '../repository/payment.repository.js';

const planLimits = {
  'Free': 10,
  'Basic': 1500,
  'Pro': 2500,
  'Enterprise': Infinity
};

export const generateInvoice = async (user_id, invoiceData) => {
  // 1. Get Company
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) {
    throw { statusCode: 400, message: 'Please complete company profile before generating an invoice.' };
  }

  // 1b. Check Plan Limits (TEMPORARILY BYPASSED FOR TEST PROCESS)
  /*
  const sub = await subService.getCurrentSubscription(user_id);
  const planName = sub && sub.Plan ? sub.Plan.name : 'Free';
  const limit = planLimits[planName] || 10;
  
  const currentMonthCount = await invoiceRepo.countInvoicesForCurrentMonth(company.id);
  if (currentMonthCount >= limit) {
    throw { statusCode: 403, message: `You have reached the monthly limit of ${limit} bills for the ${planName} plan. Please upgrade to continue generating bills.` };
  }
  */

  // Fetch Global Admin Settings to act as fallbacks
  let adminSettings = await AdminSettings.findByPk(1);
  if (!adminSettings) {
    adminSettings = { default_invoice_format: 'standard', default_gst_rate: 18.0 };
  }

  // Fetch Customer Settings to act as fallbacks
  let customerSettings = await import('../../settings/services/settings.service.js').then(m => m.getSettings(user_id));
  const fallbackGstRate = customerSettings?.default_gst_rate !== undefined 
    ? customerSettings.default_gst_rate 
    : adminSettings.default_gst_rate;

  // 2. Handle Customer (Optional creation)
  let customerId = null;
  if (invoiceData.customer_mobile) {
    const customer = await customerService.findOrCreateCustomer(company.id, {
      mobile_number: invoiceData.customer_mobile,
      name: invoiceData.customer_name || '',
      billing_address: invoiceData.billing_address || '',
      shipping_address: invoiceData.shipping_address || ''
    });
    customerId = customer.id;
  }

  // 3. Invoice Number will be assigned atomically inside invoiceRepo.createInvoice transaction

  // 4. Calculations
  let subtotal = 0;
  let discount_amount = invoiceData.discount || 0;
  let itemsToSave = [];
  
  if (invoiceData.items && invoiceData.items.length > 0) {
    for (const item of invoiceData.items) {
      const quantity = item.quantity !== undefined ? Number(item.quantity) : 1;
      const unit_price = item.unit_price !== undefined ? Number(item.unit_price) : 0;
      const total = quantity * unit_price;
      subtotal += total;
      
      itemsToSave.push({
        product_id: item.product_id || null,
        product_code: item.product_code || null,
        item_name: item.item_name || item.description || '',
        description: item.description || item.item_name || '',
        quantity,
        unit_price,
        discount: item.discount || 0,
        tax_percentage: item.tax_percentage || 0,
        total
      });
    }
  } else {
    // Fallback if someone uses the old API format
    subtotal = invoiceData.amount || 0;
  }
  
  let taxable_amount = roundTo2Decimals(subtotal - discount_amount);
  let tax_amount = 0;
  
  let cgst_rate = 0;
  let cgst_amount = 0;
  let sgst_rate = 0;
  let sgst_amount = 0;
  let igst_rate = 0;
  let igst_amount = 0;
  let total_amount = taxable_amount;
  let resolvedPlaceOfSupply = null;

  if (invoiceData.gst_enabled) {
    const effectiveGstRate = invoiceData.gst_rate !== undefined ? Number(invoiceData.gst_rate) : Number(fallbackGstRate);
    
    // Resolve seller state dynamically from company state or GSTIN
    const sellerState = company.state || (company.gst_number ? getStateFromGstin(company.gst_number)?.name : null);
    const customerPos = invoiceData.place_of_supply || null;

    const classification = determineGstClassification(sellerState, customerPos);
    resolvedPlaceOfSupply = classification.placeOfSupply;

    const split = calculateGstSplit(
      taxable_amount,
      effectiveGstRate,
      invoiceData.gst_price_type || 'exclusive',
      classification.type
    );

    taxable_amount = split.taxableAmount;
    tax_amount = split.taxAmount;
    cgst_rate = split.cgst_rate;
    cgst_amount = split.cgst_amount;
    sgst_rate = split.sgst_rate;
    sgst_amount = split.sgst_amount;
    igst_rate = split.igst_rate;
    igst_amount = split.igst_amount;

    if (invoiceData.gst_price_type === 'inclusive') {
      total_amount = roundTo2Decimals(subtotal - discount_amount);
    } else {
      total_amount = roundTo2Decimals(taxable_amount + tax_amount);
    }
  } else {
    // Without GST
    tax_amount = 0;
    total_amount = taxable_amount;
  }

  // 5. Save to DB
  const newInvoiceData = {
    company_id: company.id,
    customer_id: customerId,
    _invoice_prefix: company.invoice_prefix || 'INV',
    customer_mobile: invoiceData.customer_mobile,
    customer_name: invoiceData.customer_name,
    billing_address: invoiceData.billing_address,
    shipping_address: invoiceData.shipping_address,
    description: invoiceData.description || null,
    amount: invoiceData.amount || null,
    
    // GST fields
    gst_enabled: invoiceData.gst_enabled || false,
    gst_rate: invoiceData.gst_enabled ? (invoiceData.gst_rate !== undefined ? Number(invoiceData.gst_rate) : Number(fallbackGstRate)) : 0,
    gst_price_type: invoiceData.gst_price_type || 'exclusive',
    place_of_supply: resolvedPlaceOfSupply || invoiceData.place_of_supply || null,
    
    taxable_amount: roundTo2Decimals(taxable_amount),
    cgst_rate: roundTo2Decimals(cgst_rate),
    cgst_amount: roundTo2Decimals(cgst_amount),
    sgst_rate: roundTo2Decimals(sgst_rate),
    sgst_amount: roundTo2Decimals(sgst_amount),
    igst_rate: roundTo2Decimals(igst_rate),
    igst_amount: roundTo2Decimals(igst_amount),
    
    subtotal: roundTo2Decimals(subtotal),
    discount_amount: roundTo2Decimals(discount_amount),
    tax_amount: roundTo2Decimals(tax_amount),
    total_amount: roundTo2Decimals(total_amount),
    payment_method: invoiceData.payment_method || 'cash',
    paid_amount: invoiceData.paid_amount !== undefined ? roundTo2Decimals(Number(invoiceData.paid_amount)) : roundTo2Decimals(total_amount),
    payment_status: invoiceData.paid_amount !== undefined ? derivePaymentStatus(invoiceData.paid_amount, roundTo2Decimals(total_amount)) : 'paid',
    status: invoiceData.paid_amount !== undefined ? (derivePaymentStatus(invoiceData.paid_amount, roundTo2Decimals(total_amount)) === 'paid' ? 'paid' : (derivePaymentStatus(invoiceData.paid_amount, roundTo2Decimals(total_amount)) === 'partial' ? 'partial' : 'generated')) : 'paid',
    payment_reference: invoiceData.payment_reference || null,
    payment_notes: invoiceData.payment_notes || null,
    invoice_template: invoiceData.invoice_template === 'normal' ? 'standard' : (invoiceData.invoice_template || adminSettings.default_invoice_format || 'standard'),
    notes: invoiceData.notes,
  };

  return await invoiceRepo.createInvoice(newInvoiceData, itemsToSave);
};

export const getInvoices = async (user_id) => {
  let company;
  try {
    company = await companyService.getCompanyProfile(user_id);
  } catch {
    return [];
  }
  if (!company) return [];
  return await invoiceRepo.getInvoicesByCompany(company.id);
};

export const getInvoiceDetails = async (user_id, invoice_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  const invoice = await invoiceRepo.getInvoiceById(invoice_id, company.id);
  if (!invoice) throw { statusCode: 404, message: 'Invoice not found' };
  return invoice;
};

export const updateTemplate = async (user_id, invoice_id, template) => {
  const normalizedTemplate = template === 'normal' ? 'standard' : template;
  const company = await companyService.getCompanyProfile(user_id);
  const invoice = await invoiceRepo.updateInvoiceTemplate(invoice_id, company.id, normalizedTemplate);
  if (!invoice) throw { statusCode: 404, message: 'Invoice not found' };
  return invoice;
};

export const deleteInvoice = async (user_id, invoice_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  const deleted = await invoiceRepo.deleteInvoice(invoice_id, company.id);
  if (!deleted) throw { statusCode: 404, message: 'Invoice not found' };
  return true;
};
