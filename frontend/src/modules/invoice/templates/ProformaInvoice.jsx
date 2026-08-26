import React from 'react';

const ProformaInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const getStateFromGSTIN = (gstin) => {
    if (!gstin || gstin.length < 2) return { state: 'Tamil Nadu', code: '33' };
    const code = gstin.substring(0, 2);
    const stateMap = {
      '33': 'Tamil Nadu',
      '32': 'Kerala',
      '29': 'Karnataka',
      '36': 'Telangana',
      '28': 'Andhra Pradesh',
      '27': 'Maharashtra',
      '07': 'Delhi',
      '09': 'Uttar Pradesh',
      '24': 'Gujarat',
      '08': 'Rajasthan',
      '19': 'West Bengal'
    };
    return { state: stateMap[code] || `State (${code})`, code };
  };

  const c_name = invoice?.Company?.company_name || invoice?.Company?.name || 'Your Company Name';
  const c_addr = invoice?.Company?.address || 'Address Line 1, City, State - PIN';
  const c_gst = invoice?.Company?.gst_number || invoice?.Company?.gstin || '';
  const c_stateInfo = getStateFromGSTIN(c_gst);
  const c_phone = invoice?.Company?.phone || '';
  const c_email = invoice?.Company?.email || '';

  const cust_name = invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name';
  const cust_addr = invoice?.billing_address || 'Address';
  const cust_gst = invoice?.Customer?.gstin || '';
  const cust_stateInfo = getStateFromGSTIN(cust_gst);

  const items = invoice?.items || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#ea580c', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
        PROFORMA INVOICE
      </div>
      
      <div style={{ textAlign: 'center', color: '#ea580c', fontStyle: 'italic', marginBottom: '20px' }}>
        This is an estimate only — not a tax invoice, not valid for input tax credit.
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>{c_name}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{c_addr}</div>
              {c_gst ? <div>GSTIN: {c_gst} | State Code: {c_stateInfo.code}</div> : <div>State: {c_stateInfo.state} - Code: {c_stateInfo.code}</div>}
              <div>{c_phone && `Phone: ${c_phone}`} {c_email && `| Email: ${c_email}`}</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>Invoice No.: {invoice?.invoice_number || 'INV-0001'}</div>
              <div>Invoice Date: {invoice ? (formatDate ? formatDate(invoice.invoice_date || invoice.created_at) : new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : 'DD-Mon-YYYY'}</div>
              <div>Validity: valid for 15 days from date</div>
              <div>Expected Delivery: -</div>
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
              <div style={{ fontWeight: 'bold' }}>{cust_name}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{cust_addr}</div>
              {cust_gst && <div>GSTIN: {cust_gst}</div>}
              <div>State: {cust_stateInfo.state} Code: {cust_stateInfo.code}</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>{cust_name}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{invoice?.shipping_address || cust_addr}</div>
              {cust_gst && <div>GSTIN: {cust_gst}</div>}
              <div>State: {cust_stateInfo.state} Code: {cust_stateInfo.code}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#ffedd5', color: '#000' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>HSN/SAC</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Unit</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rate</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Est. Tax</th>
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
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.unit_price}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.gst_rate || 18}%</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.total}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', height: '100px' }}></td></tr>
          )}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Estimated Taxable Value</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>{invoice?.subtotal || '0.00'}</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Estimated CGST @ {invoice?.gst_rate ? invoice.gst_rate/2 : 9}%</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? (invoice.tax_amount/2).toFixed(2) : '0.00'}</td>
          </tr>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Estimated SGST @ {invoice?.gst_rate ? invoice.gst_rate/2 : 9}%</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.tax_amount ? (invoice.tax_amount/2).toFixed(2) : '0.00'}</td>
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
              <div style={{ marginBottom: '40px', fontWeight: 'bold' }}>for {c_name}</div>
              <div style={{ fontWeight: 'bold' }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '20px', color: '#888', fontStyle: 'italic', fontSize: '11px', textAlign: 'left' }}>
        Proforma Invoice: a quotation/estimate format marked clearly as non-tax, used before the actual sale or advance request.
      </div>
    </div>
  );
};

export default ProformaInvoice;
