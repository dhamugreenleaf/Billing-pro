import React from 'react';

const BasicInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const safeFormatCurrency = (val) => {
    if (typeof formatCurrency === 'function') return formatCurrency(val);
    return '₹' + Number(val || 0).toFixed(2);
  };

  const safeFormatDate = (val) => {
    if (typeof formatDate === 'function') return formatDate(val);
    if (!val) return 'DD/MM/YYYY';
    return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const items = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#1f2937', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', borderBottom: '2px solid #3b82f6', paddingBottom: '20px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {invoice?.Company?.logo && (
            <div style={{ maxHeight: '75px', maxWidth: '160px', overflow: 'hidden' }}>
              <img 
                src={invoice.Company.logo} 
                alt="Company Logo" 
                style={{ maxHeight: '75px', maxWidth: '160px', objectFit: 'contain' }} 
              />
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, color: '#3b82f6', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.02em' }}>INVOICE</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontWeight: 600 }}>#{invoice?.invoice_number || 'INV-0001'}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>
            {invoice?.Company?.company_name || invoice?.Company?.name || 'Your Company Name'}
          </h2>
          {invoice?.Company?.owner_name && (
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
              Prop: {invoice.Company.owner_name}
            </p>
          )}
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#4b5563', lineHeight: 1.4 }}>
            {[invoice?.Company?.address, invoice?.Company?.address_line_2, invoice?.Company?.city, invoice?.Company?.state, invoice?.Company?.pincode].filter(Boolean).join(', ') || 'Business Address'}
          </p>
          {(invoice?.Company?.phone || invoice?.Company?.email) && (
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
              {invoice?.Company?.phone && `Ph: ${invoice.Company.phone}`}
              {invoice?.Company?.phone && invoice?.Company?.email && ' | '}
              {invoice?.Company?.email && `Email: ${invoice.Company.email}`}
            </p>
          )}
          {(invoice?.Company?.gst_number || invoice?.Company?.gstin) && (
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#1e40af', fontWeight: 700 }}>
              GSTIN: {invoice?.Company?.gst_number || invoice?.Company?.gstin}
            </p>
          )}
          {invoice?.Company?.pan && (
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              PAN: {invoice.Company.pan}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>Bill To</h3>
          <p style={{ margin: 0, fontWeight: '600' }}>{invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name'}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#4b5563' }}>{invoice?.billing_address || 'Address Line'}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>Phone: {invoice?.Customer?.mobile_number || invoice?.customer_mobile || '__________'}</p>
          {invoice?.Customer?.gstin && <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>GSTIN: {invoice?.Customer?.gstin}</p>}
        </div>
        <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>Ship To</h3>
          <p style={{ margin: 0, fontWeight: '600' }}>{invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name'}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#4b5563' }}>{invoice?.shipping_address || invoice?.billing_address || 'Address Line'}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>Phone: {invoice?.Customer?.mobile_number || invoice?.customer_mobile || '__________'}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>Details</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#4b5563' }}>Invoice Date:</span>
            <span>{safeFormatDate(invoice?.invoice_date || invoice?.created_at)}</span>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bfdbfe' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #bfdbfe' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #bfdbfe' }}>Rate</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #bfdbfe' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : (item.amount ? item.amount / qty : (item.rate || 0))) || 0;
            const lineTotal = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price));
            return (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', color: '#374151' }}>{item.description || item.item_name || 'Item'}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{qty}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{safeFormatCurrency(price)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{safeFormatCurrency(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#4b5563' }}>Sub Total</span>
            <span>{safeFormatCurrency(invoice?.subtotal || (Number(invoice?.total_amount || 0) - Number(invoice?.tax_amount || 0)))}</span>
          </div>
          {invoice?.gst_enabled && Number(invoice?.tax_amount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#4b5563' }}>Tax (GST)</span>
              <span>{safeFormatCurrency(invoice?.tax_amount || 0)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', backgroundColor: '#eff6ff', borderRadius: '8px', marginTop: '10px', paddingLeft: '15px', paddingRight: '15px' }}>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Grand Total</span>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{safeFormatCurrency(invoice?.total_amount || 0)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Terms & Conditions</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '12px' }}>
          <li>Goods once sold will not be taken back.</li>
          <li>Interest @ 18% p.a. will be charged on overdue.</li>
        </ul>
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
          Powered by <strong>GoBill</strong> • https://gobill.gldatacenter.com
        </div>
      </div>
    </div>
  );
};

export default BasicInvoice;
