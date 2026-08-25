import React from 'react';

const ClassicInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const c_name = invoice?.Company?.name || 'Your Firm Name';
  const c_addr = invoice?.Company?.address || 'Address, City, State';
  const c_phone = invoice?.Company?.phone || 'xxxxxxxxxx';

  const cust_name = invoice?.Customer?.company_name || invoice?.Customer?.person_name || 'Customer Name';

  const items = invoice?.items || [];

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold' }}>CASH / CREDIT MEMO</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px', lineHeight: '1.4' }}>
        <div>{c_name}</div>
        <div>{c_addr}</div>
        <div>Phone: {c_phone}</div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '8px' }}>
              Cash Memo No.: [{invoice?.invoice_number || '0001'}]
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '8px' }}>
              Date: [{formatDate ? formatDate(invoice?.issue_date) : 'DD-Mon-YYYY'}]
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{ border: '1px solid #ccc', padding: '8px' }}>
              M/s (Customer): [{cust_name}]
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
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.rate}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.amount}</td>
            </tr>
          ))}
          {/* Empty rows to match design */}
          {items.length === 0 && (
            <tr>
              <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', height: '150px' }}></td>
            </tr>
          )}
        </tbody>
      </table>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', borderTop: 'none', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Total</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>{invoice?.subtotal || '0.00'}</td>
          </tr>
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.total_amount || '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px', verticalAlign: 'bottom', width: '50%', textAlign: 'left', fontWeight: 'bold' }}>
              Customer's Signature
            </td>
            <td style={{ padding: '8px', verticalAlign: 'bottom', width: '50%', textAlign: 'right', fontWeight: 'bold' }}>
              For [{c_name}]
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '20px', color: '#888', fontStyle: 'italic', fontSize: '11px', textAlign: 'left' }}>
        Classical Bill: simple traditional ledger-style cash memo — no GST fields, suited to small non-GST-registered businesses.
      </div>
    </div>
  );
};

export default ClassicInvoice;
