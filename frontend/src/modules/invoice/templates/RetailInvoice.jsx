import React from 'react';

const RetailInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const c_name = invoice?.Company?.name || 'Your Shop Name';
  const c_addr = invoice?.Company?.address || 'Address, City';
  const c_phone = invoice?.Company?.phone || 'xxxxxxxxxx';
  const c_gst = invoice?.Company?.gstin || 'Optional';

  const items = invoice?.items || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '20px', maxWidth: '400px', margin: '0 auto', border: '1px solid #ccc' }}>
      <div style={{ backgroundColor: '#27272a', color: '#fff', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
        CASH / RETAIL BILL
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '15px', lineHeight: '1.4' }}>
        <div style={{ fontWeight: 'bold' }}>[{c_name}]</div>
        <div>[{c_addr}] | Ph: [{c_phone}]</div>
        {c_gst && <div>GSTIN: [{c_gst}]</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px' }}>Bill No.: [{invoice?.invoice_number || '0001'}]</td>
            <td style={{ border: '1px solid #ccc', padding: '5px' }}>Date: [{formatDate ? formatDate(invoice?.issue_date) : 'DD-Mon-YYYY'}]</td>
          </tr>
          <tr>
            <td colSpan="2" style={{ border: '1px solid #ccc', padding: '5px' }}>Cashier: [Name]</td>
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
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>{item.description}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>{item.rate}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>{item.amount}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="5" style={{ border: '1px solid #ccc', height: '100px' }}></td></tr>
          )}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', width: '80%' }}>Subtotal</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', width: '20%' }}>{invoice?.subtotal || '0.00'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Discount</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>0.00</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Tax (if any)</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>{invoice?.tax_amount || '0.00'}</td>
          </tr>
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>{invoice?.total_amount || '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '20px' }}>
        Thank you! Goods once sold are not returnable.
      </div>
      
      <div style={{ color: '#888', fontStyle: 'italic', fontSize: '10px', textAlign: 'center' }}>
        Retail/POS Bill: compact counter-sale receipt for walk-in customers — minimal fields, fast to fill, printable on narrow paper.
      </div>
    </div>
  );
};

export default RetailInvoice;
