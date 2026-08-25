import React from 'react';

const ServiceInvoice = ({ invoice }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const c_name = invoice?.Company?.name || 'Your Company Name';
  const c_addr = invoice?.Company?.address || 'Address Line 1, City, State - PIN';
  const c_gst = invoice?.Company?.gstin || '';
  const c_phone = invoice?.Company?.phone || '';
  const c_email = invoice?.Company?.email || '';

  const cust_name = invoice?.Customer?.company_name || invoice?.Customer?.person_name || 'Customer Name';
  const cust_addr = invoice?.Customer?.address || '';
  const cust_gst = invoice?.Customer?.gstin || '';

  const items = invoice?.items || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#0f766e', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        SERVICE INVOICE
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>[{c_name}]</div>
              <div>[{c_addr}]</div>
              <div>GSTIN: [{c_gst}] State Code: [22]</div>
              <div>Phone: [{c_phone}] Email: [{c_email}]</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>Invoice No.: {invoice?.invoice_number}</div>
              <div>Invoice Date: {formatDate(invoice?.issue_date)}</div>
              <div>Period of Service: -</div>
              <div>Place of Supply: -</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e2e8f0' }}>
            <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Buyer (Bill to)</th>
            <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Consignee (Ship to)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>[{cust_name}]</div>
              <div>[{cust_addr}]</div>
              <div>GSTIN: [{cust_gst}]</div>
              <div>State: - Code: -</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>[{cust_name}]</div>
              <div>[{cust_addr}]</div>
              <div>GSTIN: [{cust_gst}]</div>
              <div>State: - Code: -</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#ccfbf1' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description of Service</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>SAC Code</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty/Hrs</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rate</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.hsn_sac}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.rate}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.amount}</td>
            </tr>
          ))}
          {/* Totals */}
          <tr>
            <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Taxable Value</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>CGST @ 9%</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? invoice.tax_amount/2 : 0}</td>
          </tr>
          <tr>
            <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>SGST @ 9%</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? invoice.tax_amount/2 : 0}</td>
          </tr>
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px', height: '80px', verticalAlign: 'bottom', width: '50%', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>Receiver's Signature</div>
            </td>
            <td style={{ padding: '5px', height: '80px', verticalAlign: 'bottom', width: '50%', textAlign: 'right' }}>
              <div style={{ marginBottom: '40px', fontWeight: 'bold' }}>for {c_name}</div>
              <div style={{ fontWeight: 'bold' }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '20px', color: '#64748b', fontStyle: 'italic', fontSize: '10px' }}>
        Service Invoice: for consultants/agencies — uses SAC codes and hourly/quantity rate, no stock or quantity-of-goods columns.
      </div>
    </div>
  );
};

export default ServiceInvoice;
