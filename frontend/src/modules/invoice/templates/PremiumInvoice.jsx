import React from 'react';

const PremiumInvoice = ({ invoice }) => {
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto', background: '#fcfcfc', borderTop: '10px solid #d4af37', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, color: '#d4af37', fontSize: '40px', fontWeight: 'bold', letterSpacing: '2px' }}>PREMIUM</h1>
        <div style={{ textAlign: 'right', color: '#555' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{invoice?.Company?.name}</h2>
          <p style={{ margin: 0 }}>{invoice?.Company?.address}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0', marginBottom: '40px' }}>
        <div>
          <p style={{ margin: 0, color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Invoice To</p>
          <h3 style={{ margin: '5px 0', color: '#333' }}>{invoice?.Customer?.company_name}</h3>
          <p style={{ margin: 0, color: '#555' }}>{invoice?.billing_address}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Invoice Details</p>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>#{invoice?.invoice_number}</p>
          <p style={{ margin: 0, color: '#555' }}>{invoice?.issue_date}</p>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr>
            <th style={{ padding: '15px 0', textAlign: 'left', borderBottom: '2px solid #333', color: '#333' }}>Service / Product</th>
            <th style={{ padding: '15px 0', textAlign: 'right', borderBottom: '2px solid #333', color: '#333' }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {(invoice?.items || []).map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '15px 0', borderBottom: '1px solid #eee', color: '#555' }}>{item.description}</td>
              <td style={{ padding: '15px 0', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>Total Amount</h2>
        <h1 style={{ margin: 0, color: '#d4af37', fontSize: '48px' }}>{invoice?.total_amount}</h1>
      </div>
    </div>
  );
};
export default PremiumInvoice;
