import React from 'react';

const ModernInvoice = ({ invoice, formatCurrency, formatDate }) => {
  const getStateFromGSTIN = (gstin, fallbackState) => {
    if (fallbackState) return { state: fallbackState, code: '' };
    if (!gstin || gstin.length < 2) return { state: invoice?.place_of_supply || 'State', code: '' };
    const code = gstin.substring(0, 2);
    const stateMap = {
      '01': 'Jammu & Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '26': 'Dadra & Nagar Haveli and Daman & Diu',
      '27': 'Maharashtra',
      '28': 'Andhra Pradesh',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman & Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh (New)',
      '38': 'Ladakh'
    };
    return { state: stateMap[code] || fallbackState || `State (${code})`, code };
  };

  const c_name = invoice?.Company?.company_name || invoice?.Company?.name || 'Your Company Name';
  const c_logo = invoice?.Company?.logo || '';
  const c_addr = invoice?.Company?.address || 'Address Line 1, City, State - PIN';
  const c_gst = invoice?.Company?.gst_number || invoice?.Company?.gstin || '';
  const c_stateInfo = getStateFromGSTIN(c_gst, invoice?.Company?.state);
  const c_phone = invoice?.Company?.phone || '';
  const c_email = invoice?.Company?.email || '';

  const cust_name = invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name';
  const cust_addr = invoice?.billing_address || 'Address';
  const cust_gst = invoice?.Customer?.gstin || '';
  const cust_stateInfo = getStateFromGSTIN(cust_gst);

  const items = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#6b21a8', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        TAX INVOICE
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '20px', backgroundColor: '#faf5ff' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#6b21a8' }}>
              {c_logo ? (
                <img src={c_logo} alt="Company Logo" style={{ maxHeight: '70px', maxWidth: '170px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em' }}>{c_name}</div>
              )}
            </td>
            <td style={{ width: '50%', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e1b4b' }}>{c_name}</div>
              {invoice?.Company?.owner_name && <div style={{ fontSize: '12px', color: '#6b7280' }}>Prop: {invoice.Company.owner_name}</div>}
              <div>{c_addr}</div>
              {c_phone && <div>Ph: {c_phone}</div>}
              {c_email && <div>Email: {c_email}</div>}
              {c_gst && <div style={{ fontWeight: 'bold', color: '#6b21a8' }}>GSTIN: {c_gst}</div>}
            </td>
          </tr>
        </tbody>
      </table>

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
              <div>Payment Mode: {invoice?.payment_method || 'Cash / Bank Transfer'}</div>
              <div>Place of Supply: {invoice?.place_of_supply || '-'}</div>
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
          {items.map((item, idx) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : (item.amount ? item.amount / qty : (item.rate || 0))) || 0;
            const total = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price)) || 0;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description || item.item_name || 'Item'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.hsn_sac || item.hsn || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{qty}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.unit || 'Nos'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{price.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{invoice?.gst_rate || 18}%</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{total.toFixed(2)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', height: '100px', textAlign: 'center', color: '#888' }}>No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '80%' }}>Taxable Value</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '20%' }}>{invoice?.taxable_amount || invoice?.subtotal || '0.00'}</td>
          </tr>
          {Number(invoice?.igst_amount || 0) > 0 ? (
            <tr>
              <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>IGST ({invoice?.igst_rate || invoice?.gst_rate || 0}%)</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{Number(invoice.igst_amount).toFixed(2)}</td>
            </tr>
          ) : (
            <>
              <tr>
                <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>CGST ({invoice?.cgst_rate || (invoice?.gst_rate ? invoice.gst_rate / 2 : 0)}%)</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{Number(invoice?.cgst_amount || (invoice?.tax_amount ? invoice.tax_amount / 2 : 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>SGST ({invoice?.sgst_rate || (invoice?.gst_rate ? invoice.gst_rate / 2 : 0)}%)</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{Number(invoice?.sgst_amount || (invoice?.tax_amount ? invoice.tax_amount / 2 : 0)).toFixed(2)}</td>
              </tr>
            </>
          )}
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

      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
        Generated via <strong>GoBill</strong> • https://gobill.gldatacenter.com
      </div>
    </div>
  );
};

export default ModernInvoice;
