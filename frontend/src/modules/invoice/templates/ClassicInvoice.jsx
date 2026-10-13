import React from 'react';

const ClassicInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const Company = invoice?.Company || {};
  const c_name = Company?.company_name || Company?.name || 'Your Firm Name';
  const owner_name = Company?.owner_name || '';
  
  const addressParts = [
    Company?.address,
    Company?.address_line_2,
    Company?.city,
    Company?.state ? (Company?.pincode ? `${Company.state} - ${Company.pincode}` : Company.state) : (Company?.pincode ? `PIN: ${Company.pincode}` : '')
  ].filter(Boolean);
  const c_addr = addressParts.length > 0 ? addressParts.join(', ') : (Company?.address || 'Address, City, State');
  
  const c_phone = [Company?.phone, Company?.additionalPhone].filter(Boolean).join(', ') || 'xxxxxxxxxx';
  const c_gst = Company?.gst_number || '';
  const c_pan = Company?.pan || '';

  const cust_name = invoice?.Customer?.company_name || invoice?.Customer?.name || invoice?.customer_name || 'Customer Name';
  const cust_phone = invoice?.customer_mobile || invoice?.Customer?.mobile_number || '';
  const cust_addr = invoice?.billing_address || invoice?.Customer?.address || '';

  const items = (invoice?.items && invoice.items.length > 0) ? invoice.items : (invoice?.InvoiceItems || []);

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto', border: '1px solid #ddd' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold' }}>CASH / CREDIT MEMO</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px', lineHeight: '1.4' }}>
        {Company?.logo && (
          <div style={{ marginBottom: '8px' }}>
            <img src={Company.logo} alt="Logo" style={{ maxHeight: '65px', maxWidth: '140px', objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{c_name}</div>
        {owner_name && <div style={{ fontSize: '13px', fontStyle: 'italic' }}>Proprietor: {owner_name}</div>}
        <div>{c_addr}</div>
        <div>Phone: {c_phone}</div>
        {c_gst && <div>GSTIN: {c_gst}</div>}
        {c_pan && <div>PAN: {c_pan}</div>}
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '8px' }}>
              Cash Memo No.: <strong>{invoice?.invoice_number || '0001'}</strong>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '8px' }}>
              Date: <strong>{invoice ? (formatDate ? formatDate(invoice.invoice_date || invoice.created_at) : new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : 'DD-Mon-YYYY'}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{ border: '1px solid #ccc', padding: '8px' }}>
              <div><strong>M/s (Customer):</strong> {cust_name} {invoice?.Customer?.gstin ? `| GSTIN: ${invoice.Customer.gstin}` : ''}</div>
              {cust_addr && <div style={{ fontSize: '12px', color: '#444' }}>Address: {cust_addr}</div>}
              {cust_phone && <div style={{ fontSize: '12px', color: '#444' }}>Phone: {cust_phone}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '5%' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '50%' }}>Particulars</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '10%' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '15%' }}>Rate (Rs.)</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '20%' }}>Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const q = Number(item.quantity) || 1;
            const p = Number(item.unit_price !== undefined ? item.unit_price : (item.amount ? item.amount / q : 0)) || 0;
            const t = Number(item.total !== undefined ? item.total : (q * p)) || 0;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description || item.item_name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{q}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{p.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{t.toFixed(2)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', height: '100px', textAlign: 'center', color: '#888' }}>
                No items
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', borderTop: 'none', marginBottom: '30px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Subtotal</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>
              ₹ {Number(invoice?.subtotal || invoice?.amount || invoice?.total_amount || 0).toFixed(2)}
            </td>
          </tr>
          {Number(invoice?.tax_amount || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Tax (GST)</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>
                ₹ {Number(invoice.tax_amount).toFixed(2)}
              </td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>
              ₹ {Number(invoice?.total_amount || invoice?.total || 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px', verticalAlign: 'bottom', width: '50%', textAlign: 'left', fontWeight: 'bold' }}>
              Customer's Signature
            </td>
            <td style={{ padding: '8px', verticalAlign: 'bottom', width: '50%', textAlign: 'right', fontWeight: 'bold' }}>
              For {c_name}
            </td>
          </tr>
        </tbody>
      </table>

      {invoice?.notes && (
        <div style={{ marginTop: '14px', fontSize: '11px', color: '#555' }}>
          <strong>Remarks:</strong> {invoice.notes}
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
        Generated via <strong>GoBill</strong> • https://gobill.gldatacenter.com
      </div>
    </div>
  );
};

export default ClassicInvoice;
