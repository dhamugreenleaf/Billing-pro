import React from 'react';

const PremiumInvoice = ({ invoice }) => {
  const items = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  const invDate = invoice?.invoice_date 
    ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : (invoice?.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'DD-Mon-YYYY');

  const totalAmount = Number(invoice?.total_amount || invoice?.total || 0);
  const taxAmount = Number(invoice?.tax_amount || 0);
  const subtotal = Number(invoice?.subtotal || invoice?.amount || (totalAmount - taxAmount)) || 0;

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto', background: '#fcfcfc', borderTop: '10px solid #d4af37', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {invoice?.Company?.logo && (
            <img src={invoice.Company.logo} alt="Logo" style={{ maxHeight: '70px', maxWidth: '150px', objectFit: 'contain' }} />
          )}
          <h1 style={{ margin: 0, color: '#d4af37', fontSize: '38px', fontWeight: 'bold', letterSpacing: '2px' }}>PREMIUM</h1>
        </div>
        <div style={{ textAlign: 'right', color: '#555' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{invoice?.Company?.company_name || invoice?.Company?.name || 'Your Company Name'}</h2>
          {invoice?.Company?.owner_name && <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>Prop: {invoice.Company.owner_name}</p>}
          <p style={{ margin: '2px 0 0 0' }}>{invoice?.Company?.address}</p>
          {invoice?.Company?.phone && <p style={{ margin: '2px 0 0 0' }}>Ph: {invoice.Company.phone}</p>}
          {invoice?.Company?.gst_number && <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>GSTIN: {invoice.Company.gst_number}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0', marginBottom: '30px' }}>
        <div>
          <p style={{ margin: 0, color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Invoice To</p>
          <h3 style={{ margin: '5px 0', color: '#333' }}>{invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name'}</h3>
          <p style={{ margin: 0, color: '#555' }}>{invoice?.billing_address}</p>
          {(invoice?.customer_mobile || invoice?.Customer?.mobile_number) && (
            <p style={{ margin: '2px 0 0 0', color: '#555' }}>Ph: {invoice.customer_mobile || invoice.Customer.mobile_number}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Invoice Details</p>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold', fontSize: '16px' }}>#{invoice?.invoice_number || 'INV-001'}</p>
          <p style={{ margin: '2px 0 0', color: '#555' }}>{invDate}</p>
          {invoice?.payment_method && <p style={{ margin: '2px 0 0', color: '#888', textTransform: 'capitalize' }}>Payment: {invoice.payment_method}</p>}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 0', textAlign: 'left', borderBottom: '2px solid #333', color: '#333' }}>Item / Description</th>
            <th style={{ padding: '12px 0', textAlign: 'center', borderBottom: '2px solid #333', color: '#333' }}>Qty</th>
            <th style={{ padding: '12px 0', textAlign: 'right', borderBottom: '2px solid #333', color: '#333' }}>Rate</th>
            <th style={{ padding: '12px 0', textAlign: 'right', borderBottom: '2px solid #333', color: '#333' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : (item.amount ? item.amount / qty : (item.rate || 0))) || 0;
            const lineTotal = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price)) || 0;
            return (
              <tr key={idx}>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #eee', color: '#444' }}>{item.description || item.item_name || 'Item'}</td>
                <td style={{ padding: '12px 0', textAlign: 'center', borderBottom: '1px solid #eee', color: '#555' }}>{qty}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', borderBottom: '1px solid #eee', color: '#555' }}>₹{price.toFixed(2)}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>₹{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan="4" style={{ padding: '30px 0', textAlign: 'center', color: '#999' }}>No items</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ width: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#555' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {Number(invoice?.discount_amount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669' }}>
              <span>Discount</span>
              <span>- ₹{Number(invoice.discount_amount).toFixed(2)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#555' }}>
              <span>GST ({invoice?.gst_rate || 18}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '2px solid #d4af37', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Total Amount</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#d4af37' }}>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
        Generated via <strong>GoBill</strong> • https://gobill.gldatacenter.com
      </div>
    </div>
  );
};
export default PremiumInvoice;
