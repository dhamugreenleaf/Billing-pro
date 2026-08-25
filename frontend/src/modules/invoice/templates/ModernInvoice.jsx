import React from 'react';

const ModernInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const c_name = invoice?.Company?.name || 'Your Company Name';
  const c_addr = invoice?.Company?.address || 'Address Line 1, City, State - PIN';
  const c_gst = invoice?.Company?.gstin || '22AAAAA0000A1Z5';
  const c_phone = invoice?.Company?.phone || 'xxxxxxxxxx';
  const c_email = invoice?.Company?.email || 'name@company.com';

  const cust_name = invoice?.Customer?.company_name || invoice?.Customer?.person_name || 'Customer Name';
  const cust_addr = invoice?.Customer?.address || 'Address';
  const cust_gst = invoice?.Customer?.gstin || 'Buyer GSTIN';

  const items = invoice?.items || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#6b21a8', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        TAX INVOICE
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '20px', backgroundColor: '#faf5ff' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'center', fontWeight: 'bold', color: '#6b21a8' }}>
              [ LOGO ]
            </td>
            <td style={{ width: '50%', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>[{c_name}]</div>
              <div>[Tagline]</div>
              <div>GSTIN: [{c_gst}]</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>[{c_name}]</div>
              <div>[{c_addr}]</div>
              <div>GSTIN: [{c_gst}] State Code: [22]</div>
              <div>Phone: [{c_phone}] Email: [{c_email}]</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>Invoice No.: {invoice?.invoice_number || 'INV-0001'}</div>
              <div>Invoice Date: {formatDate ? formatDate(invoice?.issue_date) : 'DD-Mon-YYYY'}</div>
              <div>Payment Mode: [UPI / Bank Transfer]</div>
              <div>Place of Supply: [State]</div>
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
              <div>State: [State] Code: [Code]</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>[Consignee Name]</div>
              <div>[Address]</div>
              <div>GSTIN: [Consignee GSTIN]</div>
              <div>State: [State] Code: [Code]</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e8d5f9', color: '#000' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>HSN/SAC</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Unit</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rate</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>GST%</th>
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
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Nos</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.rate}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>18%</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.amount}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', height: '100px' }}></td>
            </tr>
          )}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Taxable Value</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>{invoice?.subtotal || '0.00'}</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>CGST</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? (invoice.tax_amount/2).toFixed(2) : '0.00'}</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>SGST</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? (invoice.tax_amount/2).toFixed(2) : '0.00'}</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>IGST</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>0.00</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Round Off</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>0.00</td>
          </tr>
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.total_amount || '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px', height: '80px', verticalAlign: 'bottom', width: '50%', textAlign: 'center', fontWeight: 'bold' }}>
              Receiver's Signature
            </td>
            <td style={{ padding: '8px', height: '80px', verticalAlign: 'bottom', width: '50%', textAlign: 'center' }}>
              <div style={{ marginBottom: '40px', fontWeight: 'bold' }}>for [{c_name}]</div>
              <div style={{ fontWeight: 'bold' }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '20px', color: '#888', fontStyle: 'italic', fontSize: '11px', textAlign: 'left' }}>
        Modern GST Invoice: same GST fields as a standard invoice with a logo placeholder and a bolder modern color accent for client-facing use.
      </div>
    </div>
  );
};

export default ModernInvoice;
