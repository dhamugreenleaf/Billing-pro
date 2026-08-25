import * as invoiceRepo from '../repository/invoice.repository.js';
import * as customerService from '../../customer/services/customer.service.js';
import * as companyService from '../../company/services/company.service.js';
import AdminSettings from '../../admin/model/adminSettings.model.js';

const generateInvoiceNumber = (prefix, count) => {
  const paddedCount = String(count + 1).padStart(6, '0');
  return `${prefix}-${paddedCount}`;
};

export const generateInvoice = async (user_id, invoiceData) => {
  // 1. Get Company
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) {
    throw { statusCode: 400, message: 'Please complete company profile before generating an invoice.' };
  }

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
      address: invoiceData.customer_address || ''
    });
    customerId = customer.id;
  }

  // 3. Generate Invoice Number
  const currentCount = await invoiceRepo.countInvoicesByCompany(company.id);
  const invoice_number = generateInvoiceNumber(company.invoice_prefix || 'INV', currentCount);

  // 4. Calculations
  let subtotal = 0;
  let discount_amount = invoiceData.discount || 0;
  let itemsToSave = [];
  
  // Basic calculation logic
  subtotal = invoiceData.amount;
  let taxable_amount = subtotal - discount_amount;
  let tax_amount = 0;
  
  let cgst_rate = 0;
  let cgst_amount = 0;
  let sgst_rate = 0;
  let sgst_amount = 0;
  let igst_rate = 0;
  let igst_amount = 0;
  let total_amount = taxable_amount;

  if (invoiceData.gst_enabled) {
    const gst_rate = invoiceData.gst_rate || 0;
    
    if (invoiceData.gst_price_type === 'inclusive') {
      // Customer Amount = Total Amount
      // Taxable Value = Total Amount / (1 + (GST Rate / 100))
      // GST Amount = Total Amount - Taxable Value
      total_amount = subtotal;
      taxable_amount = total_amount / (1 + (gst_rate / 100));
      tax_amount = total_amount - taxable_amount;
    } else {
      // Add GST
      tax_amount = (taxable_amount * gst_rate) / 100;
      total_amount = taxable_amount + tax_amount;
    }

    const companyState = company.state ? company.state.trim().toLowerCase() : '';
    const pos = invoiceData.place_of_supply ? invoiceData.place_of_supply.trim().toLowerCase() : '';

    if (companyState && pos && companyState !== pos) {
      // Inter-state
      igst_rate = gst_rate;
      igst_amount = tax_amount;
    } else {
      // Intra-state or no state info (default to intra)
      cgst_rate = gst_rate / 2;
      sgst_rate = gst_rate / 2;
      cgst_amount = tax_amount / 2;
      sgst_amount = tax_amount / 2;
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
    invoice_number,
    customer_mobile: invoiceData.customer_mobile,
    customer_name: invoiceData.customer_name,
    description: invoiceData.description,
    amount: invoiceData.amount,
    
    // GST fields
    gst_enabled: invoiceData.gst_enabled || false,
    gst_rate: invoiceData.gst_enabled ? (invoiceData.gst_rate !== undefined ? invoiceData.gst_rate : fallbackGstRate) : 0,
    gst_price_type: invoiceData.gst_price_type || 'exclusive',
    place_of_supply: invoiceData.place_of_supply || null,
    
    taxable_amount,
    cgst_rate,
    cgst_amount,
    sgst_rate,
    sgst_amount,
    igst_rate,
    igst_amount,
    
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
    payment_method: invoiceData.payment_method || 'cash',
    invoice_template: invoiceData.invoice_template || adminSettings.default_invoice_format,
    notes: invoiceData.notes,
  };

  return await invoiceRepo.createInvoice(newInvoiceData, itemsToSave);
};

export const getInvoices = async (user_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  return await invoiceRepo.getInvoicesByCompany(company.id);
};

export const getInvoiceDetails = async (user_id, invoice_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  const invoice = await invoiceRepo.getInvoiceById(invoice_id, company.id);
  if (!invoice) throw { statusCode: 404, message: 'Invoice not found' };
  return invoice;
};

export const updateTemplate = async (user_id, invoice_id, template) => {
  const company = await companyService.getCompanyProfile(user_id);
  const invoice = await invoiceRepo.updateInvoiceTemplate(invoice_id, company.id, template);
  if (!invoice) throw { statusCode: 404, message: 'Invoice not found' };
  return invoice;
};

export const deleteInvoice = async (user_id, invoice_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  const deleted = await invoiceRepo.deleteInvoice(invoice_id, company.id);
  if (!deleted) throw { statusCode: 404, message: 'Invoice not found' };
  return true;
};
