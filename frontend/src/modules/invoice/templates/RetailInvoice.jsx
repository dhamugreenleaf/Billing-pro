import React from 'react';

const RetailInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const c_name = invoice?.Company?.company_name || invoice?.Company?.name || 'Your Shop Name';
  const c_addr = invoice?.Company?.address || 'Address, City';
  const c_phone = invoice?.Company?.phone || '';
  const c_gst = invoice?.Company?.gst_number || invoice?.Company?.gstin || '';

  const items = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  const totalAmount = Number(invoice?.total_amount || invoice?.total || 0);
  const taxAmount = Number(invoice?.tax_amount || 0);
  const discountAmount = Number(invoice?.discount_amount || invoice?.discount || 0);
  const subtotal = Number(invoice?.subtotal || invoice?.amount || (totalAmount - taxAmount + discountAmount)) || 0;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '20px', maxWidth: '400px', margin: '0 auto', border: '1px solid #ccc' }}>
      <div style={{ backgroundColor: '#27272a', color: '#fff', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
        CASH / RETAIL BILL
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '15px', lineHeight: '1.4' }}>
        {invoice?.Company?.logo && (
          <div style={{ marginBottom: '8px' }}>
            <img src={invoice.Company.logo} alt="Logo" style={{ maxHeight: '55px', maxWidth: '120px', objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c_name}</div>
        {invoice?.Company?.owner_name && <div style={{ fontSize: '11px', color: '#444' }}>Prop: {invoice.Company.owner_name}</div>}
        <div>{c_addr}{c_phone ? ` | Ph: ${c_phone}` : ''}</div>
        {c_gst && <div>GSTIN: {c_gst}</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px' }}>Bill No.: <strong>{invoice?.invoice_number || '0001'}</strong></td>
            <td style={{ border: '1px solid #ccc', padding: '5px' }}>Date: <strong>{invoice ? (formatDate ? formatDate(invoice.invoice_date || invoice.created_at) : new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : 'DD-Mon-YYYY'}</strong></td>
          </tr>
          <tr>
            <td colSpan="2" style={{ border: '1px solid #ccc', padding: '5px' }}>
              Customer: <strong>{invoice?.Customer?.company_name || invoice?.customer_name || 'Walk-in Customer'}</strong>
              {(invoice?.customer_mobile || invoice?.Customer?.mobile_number) && ` (${invoice?.customer_mobile || invoice?.Customer?.mobile_number})`}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '15px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f5' }}>
            <th style={{ border: '1px solid #ccc', padding: '5px', width: '10%' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '5px', width: '40%' }}>Item</th>
            <th style={{ border: '1px solid #ccc', padding: '5px', width: '15%' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '5px', width: '15%' }}>Rate</th>
            <th style={{ border: '1px solid #ccc', padding: '5px', width: '20%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : (item.amount ? item.amount / qty : (item.rate || 0))) || 0;
            const lineTotal = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price)) || 0;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{item.description || item.item_name || 'Item'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{qty}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>₹{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan="5" style={{ border: '1px solid #ccc', height: '80px', textAlign: 'center', color: '#888' }}>No items</td></tr>
          )}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', width: '70%' }}>Subtotal</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', width: '30%' }}>₹{subtotal.toFixed(2)}</td>
          </tr>
          {discountAmount > 0 && (
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Discount</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', color: '#16a34a' }}>- ₹{discountAmount.toFixed(2)}</td>
            </tr>
          )}
          {taxAmount > 0 && (
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Tax (GST)</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>₹{taxAmount.toFixed(2)}</td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Grand Total</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '8px' }}>
        Thank you! Goods once sold are not returnable.
      </div>
      <div style={{ textAlign: 'center', fontSize: '9px', color: '#64748b', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
        Generated via <strong>GoBill</strong> • https://gobill.gldatacenter.com
      </div>
    </div>
  );
};

export default RetailInvoice;
