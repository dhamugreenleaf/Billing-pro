import React from 'react';

const BasicInvoice = ({ invoice, formatCurrency, formatDate }) => {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#1f2937', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '2px solid #3b82f6', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#3b82f6', fontSize: '32px', fontWeight: '800' }}>INVOICE</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>#{invoice?.invoice_number || 'INV-0001'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{invoice?.Company?.company_name || invoice?.Company?.name || 'Your Company Name'}</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#4b5563' }}>{invoice?.Company?.address || 'City, State - Pincode'}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>Phone: {invoice?.Company?.phone || '__________'}</p>
          {(invoice?.Company?.gst_number || invoice?.Company?.gstin) && <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>GSTIN: {invoice?.Company?.gst_number || invoice?.Company?.gstin}</p>}
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
            <span>{invoice ? formatDate(invoice.invoice_date || invoice.created_at) : 'DD/MM/YYYY'}</span>
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
          {(invoice?.items || [{}, {}, {}]).map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px', color: '#374151' }}>{item.description || '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{item.quantity || '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{item.unit_price ? formatCurrency(item.unit_price) : '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{item.total ? formatCurrency(item.total) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#4b5563' }}>Sub Total</span>
            <span>{formatCurrency(invoice?.subtotal || 0)}</span>
          </div>
          {invoice?.gst_enabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#4b5563' }}>Tax</span>
              <span>{formatCurrency(invoice?.tax_amount || 0)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', backgroundColor: '#eff6ff', borderRadius: '8px', marginTop: '10px', paddingLeft: '15px', paddingRight: '15px' }}>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Grand Total</span>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{formatCurrency(invoice?.total_amount || 0)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Terms & Conditions</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '12px' }}>
          <li>Goods once sold will not be taken back.</li>
          <li>Interest @ 18% p.a. will be charged on overdue.</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicInvoice;
