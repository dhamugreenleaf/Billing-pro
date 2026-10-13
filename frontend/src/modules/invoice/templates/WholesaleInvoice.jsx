import React from 'react';

const WholesaleInvoice = ({ invoice }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

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
  const c_addr = invoice?.Company?.address || 'Address Line 1, City, State - PIN';
  const c_gst = invoice?.Company?.gst_number || invoice?.Company?.gstin || '';
  const c_stateInfo = getStateFromGSTIN(c_gst, invoice?.Company?.state);
  const c_phone = invoice?.Company?.phone || '';
  const c_email = invoice?.Company?.email || '';

  const cust_name = invoice?.Customer?.company_name || invoice?.customer_name || 'Customer Name';
  const cust_addr = invoice?.billing_address || '';
  const cust_gst = invoice?.Customer?.gstin || '';
  const cust_stateInfo = getStateFromGSTIN(cust_gst);

  const items = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#166534', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        WHOLESALE / B2B TAX INVOICE
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {invoice?.Company?.logo && (
                  <img src={invoice.Company.logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c_name}</div>
                  {invoice?.Company?.owner_name && <div style={{ fontSize: '12px', color: '#666' }}>Prop: {invoice.Company.owner_name}</div>}
                  <div style={{ whiteSpace: 'pre-line' }}>{c_addr}</div>
                  {c_gst ? <div>GSTIN: {c_gst} | State Code: {c_stateInfo.code}</div> : <div>State: {c_stateInfo.state} - Code: {c_stateInfo.code}</div>}
                  <div>{c_phone && `Phone: ${c_phone}`} {c_email && `| Email: ${c_email}`}</div>
                </div>
              </div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div>Invoice No.: <strong>{invoice?.invoice_number || 'INV-0001'}</strong></div>
              <div>Invoice Date: <strong>{formatDate(invoice?.invoice_date || invoice?.created_at)}</strong></div>
              <div>Order Ref No.: -</div>
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
              <div>State: {cust_stateInfo.state} - Code: {cust_stateInfo.code}</div>
            </td>
            <td style={{ width: '50%', border: '1px solid #ccc', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>{cust_name}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{invoice?.shipping_address || cust_addr}</div>
              {cust_gst && <div>GSTIN: {cust_gst}</div>}
              <div>State: {cust_stateInfo.state} - Code: {cust_stateInfo.code}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#bbf7d0' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sl</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>HSN</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Batch No.</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Unit</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rate</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Disc%</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount) || 0;
            const lineTotal = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * price));
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description || item.item_name || 'Item'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.hsn_sac || item.product_code || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>-</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{qty}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Nos</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{price.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>0</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {/* Totals */}
          <tr>
            <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Taxable Value</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.taxable_amount || invoice?.subtotal)}</td>
          </tr>
          {Number(invoice?.igst_amount || 0) > 0 ? (
            <tr>
              <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>IGST @ {invoice?.igst_rate || invoice?.gst_rate || 0}%</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice.igst_amount)}</td>
            </tr>
          ) : (
            <>
              <tr>
                <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>CGST @ {invoice?.cgst_rate || (invoice?.gst_rate ? invoice.gst_rate / 2 : 0)}%</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.cgst_amount || (invoice?.tax_amount ? invoice.tax_amount / 2 : 0))}</td>
              </tr>
              <tr>
                <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>SGST @ {invoice?.sgst_rate || (invoice?.gst_rate ? invoice.gst_rate / 2 : 0)}%</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.sgst_amount || (invoice?.tax_amount ? invoice.tax_amount / 2 : 0))}</td>
              </tr>
            </>
          )}
          <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
            <td colSpan="8" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Invoice Amount</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{formatCurrency(invoice?.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ margin: '0 0 5px 0' }}>Transport Details</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '30px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', width: '50%' }}>Transporter Name: -</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', width: '50%' }}>Vehicle No.: -</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', width: '50%' }}>E-Way Bill No.: -</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', width: '50%' }}>LR/RR No.: -</td>
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

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
        Generated via <strong>GoBill</strong> • https://gobill.gldatacenter.com
      </div>
    </div>
  );
};

export default WholesaleInvoice;
