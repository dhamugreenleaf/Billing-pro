import Invoice from '../model/invoice.model.js';
import InvoiceItem from '../model/invoiceItem.model.js';
import Company from '../../company/model/company.model.js';
import Customer from '../../customer/model/customer.model.js';

export const createInvoice = async (invoiceData, itemsData) => {
  const invoice = await Invoice.create(invoiceData);
  
  if (itemsData && itemsData.length > 0) {
    const itemsToCreate = itemsData.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));
    await InvoiceItem.bulkCreate(itemsToCreate);
  }

  return await Invoice.findByPk(invoice.id, {
    include: [{ model: InvoiceItem, as: 'items' }]
  });
};

export const getInvoicesByCompany = async (company_id) => {
  return await Invoice.findAll({ 
    where: { company_id },
    order: [['created_at', 'DESC']]
  });
};

export const getInvoiceById = async (id, company_id) => {
  return await Invoice.findOne({
    where: { id, company_id },
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Company },
      { model: Customer }
    ]
  });
};

export const countInvoicesByCompany = async (company_id) => {
  return await Invoice.count({ where: { company_id } });
};

export const updateInvoiceTemplate = async (id, company_id, template) => {
  const invoice = await Invoice.findOne({ where: { id, company_id } });
  if (invoice) {
    invoice.invoice_template = template;
    await invoice.save();
  }
  return invoice;
};

export const deleteInvoice = async (id, company_id) => {
  const result = await Invoice.destroy({ where: { id, company_id } });
  return result > 0;
};

