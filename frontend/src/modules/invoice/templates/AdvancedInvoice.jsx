import React from 'react';
import { numberToWords } from '../../../utils/numberToWords';

const AdvancedInvoice = ({ invoice }) => {
  if (!invoice) return null;

  const { Company } = invoice;
  const items = (invoice.items && invoice.items.length > 0) ? invoice.items : (invoice.InvoiceItems || []);
  const companyName = Company?.company_name || 'Your Company Name';
  const ownerName = Company?.owner_name || '';
  const addressParts = [
    Company?.address,
    Company?.address_line_2,
    Company?.city,
    Company?.state ? (Company?.pincode ? `${Company.state} - ${Company.pincode}` : Company.state) : (Company?.pincode ? `PIN: ${Company.pincode}` : '')
  ].filter(Boolean);
  const companyAddress = addressParts.length > 0 ? addressParts.join(', ') : (Company?.address || 'Address Line 1, City, State');
  const companyGst = Company?.gst_number || 'Unregistered';
  const companyPan = Company?.pan || '';
  const companyEmail = Company?.email || '';
  const companyPhone = [Company?.phone, Company?.additionalPhone].filter(Boolean).join(', ');
  
  const buyerName = invoice.customer_name || 'Cash Customer';
  const buyerMobile = invoice.customer_mobile || '';
  const buyerAddress = invoice?.billing_address || '';
  
  const invDate = new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const taxAmount = Number(invoice.tax_amount) || 0;
  const totalAmount = Number(invoice.total_amount) || 0;
  const subtotal = Number(invoice.subtotal || (totalAmount - taxAmount)) || 0;
  
  const displayItems = (items && items.length > 0) ? items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price !== undefined && item.unit_price !== '' 
      ? item.unit_price 
      : (item.amount ? Number(item.amount) / qty : (item.rate || 0))) || 0;
    const lineTotal = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price)) || 0;
    return {
      description: item.description || item.item_name || 'Item',
      hsn: item.hsn || item.hsn_sac || item.product_code || '9983',
      quantity: qty,
      unit: item.unit || 'Nos',
      unit_price: price,
      total: lineTotal
    };
  }) : [{
    description: invoice.description || 'General Item / Sale',
    hsn: '9983',
    quantity: 1,
    unit: 'Nos',
    unit_price: subtotal,
    total: subtotal
  }];

  return (
    <div style={{
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '13px',
      boxSizing: 'border-box',
      padding: '40px',
      borderTop: '8px solid var(--color-primary)'
    }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f3f4f6', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {Company?.logo ? (
            <img src={Company.logo} alt="Company Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold' }}>
              {companyName.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#111827' }}>{companyName}</h1>
            {ownerName && <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '2px' }}>Prop: {ownerName}</div>}
            <div style={{ color: '#6b7280', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{companyAddress}</div>
            <div style={{ color: '#6b7280', marginTop: '4px' }}>GSTIN: <span style={{ fontWeight: '600', color: '#374151' }}>{companyGst}</span></div>
            {companyPan && <div style={{ color: '#6b7280' }}>PAN: <span style={{ fontWeight: '600', color: '#374151' }}>{companyPan}</span></div>}
            {companyPhone && <div style={{ color: '#6b7280' }}>Phone: {companyPhone}</div>}
            {companyEmail && <div style={{ color: '#6b7280' }}>Email: {companyEmail}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '32px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>INVOICE</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 20px', justifyContent: 'end', textAlign: 'left' }}>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>Invoice No:</div>
            <div style={{ fontWeight: '600', color: '#111827', textAlign: 'right' }}>{invoice.invoice_number}</div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>Date:</div>
            <div style={{ fontWeight: '600', color: '#111827', textAlign: 'right' }}>{invDate}</div>
            <div style={{ color: '#6b7280', fontWeight: '500' }}>Payment Mode:</div>
            <div style={{ fontWeight: '600', color: '#111827', textAlign: 'right', textTransform: 'capitalize' }}>{invoice.payment_method}</div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Bill To:</h3>
        <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '4px' }}>{buyerName}</div>
          {buyerAddress && <div style={{ color: '#4b5563', whiteSpace: 'pre-line', marginBottom: '4px', lineHeight: '1.5' }}>{buyerAddress}</div>}
          <div style={{ color: '#4b5563' }}>Phone: {buyerMobile}</div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
            <th style={{ padding: '12px 15px', textAlign: 'left', borderRadius: '6px 0 0 6px', fontWeight: '500' }}>Description</th>
            <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '500' }}>HSN</th>
            <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '500' }}>Qty</th>
            <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '500' }}>Rate</th>
            <th style={{ padding: '12px 15px', textAlign: 'right', borderRadius: '0 6px 6px 0', fontWeight: '500' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '15px', textAlign: 'left', fontWeight: '500', color: '#111827' }}>{item.description}</td>
              <td style={{ padding: '15px', textAlign: 'center', color: '#4b5563' }}>{item.hsn}</td>
              <td style={{ padding: '15px', textAlign: 'center', color: '#4b5563' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '15px', textAlign: 'right', color: '#4b5563' }}>₹ {Number(item.unit_price).toFixed(2)}</td>
              <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>₹ {Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px' }}>
        <div style={{ width: '50%' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase' }}>Amount in Words</h4>
          <p style={{ margin: '0 0 20px 0', fontWeight: '600', color: '#111827', fontStyle: 'italic' }}>
            Rupees {numberToWords(Math.round(totalAmount))} Only
          </p>
          
          {invoice.notes && (
            <div>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase' }}>Notes / Terms</h4>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '12px', lineHeight: '1.5' }}>{invoice.notes}</p>
            </div>
          )}
        </div>
        
        <div style={{ width: '40%', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#4b5563' }}>
            <span>Subtotal</span>
            <span>₹ {subtotal.toFixed(2)}</span>
          </div>
          {taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#4b5563' }}>
              <span>Tax ({invoice.gst_rate || 18}%)</span>
              <span>₹ {taxAmount.toFixed(2)}</span>
            </div>
          )}
          {Number(invoice.discount_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--color-success)' }}>
              <span>Discount</span>
              <span>- ₹ {Number(invoice.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '2px solid #e5e7eb', margin: '15px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Total Amount</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>₹ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', width: '250px' }}>
          <div style={{ borderBottom: '1px solid #111827', height: '40px', marginBottom: '10px' }}></div>
          <div style={{ fontWeight: '600', color: '#111827' }}>Authorized Signatory</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>For {companyName}</div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '11px', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
        This is a computer generated invoice • Generated via <strong>GoBill</strong> (https://gobill.gldatacenter.com)
      </div>
    </div>
  );
};

export default AdvancedInvoice;
