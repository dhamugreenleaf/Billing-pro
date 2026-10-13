import React from 'react';
import { numberToWords } from '../../../utils/numberToWords';

const TallyInvoice = ({ invoice }) => {
  if (!invoice) return null;

  const Company = invoice?.Company || {};
  const companyName = Company?.company_name || 'Your Company Name';
  const ownerName = Company?.owner_name || '';
  const companyLogo = Company?.logo || '';
  
  // Construct full company address from all profile fields
  const addressParts = [
    Company?.address,
    Company?.address_line_2,
    Company?.city,
    Company?.state ? (Company?.pincode ? `${Company.state} - ${Company.pincode}` : Company.state) : (Company?.pincode ? `PIN: ${Company.pincode}` : null),
    Company?.country && Company?.country !== 'India' ? Company.country : null
  ].filter(Boolean);
  const companyAddress = addressParts.length > 0 ? addressParts.join(', ') : (Company?.address || 'Address Line 1, City, State');
  
  const companyState = Company?.state || 'State';
  const companyGst = Company?.gst_number || 'Unregistered';
  const companyPan = Company?.pan || '';
  const companyEmail = Company?.email || '';
  const companyPhone = [Company?.phone, Company?.additionalPhone].filter(Boolean).join(', ');
  const companyWebsite = Company?.website || '';
  
  const buyerName = invoice?.customer_name || invoice?.Customer?.company_name || invoice?.Customer?.name || 'Cash Customer';
  const buyerMobile = invoice?.customer_mobile || invoice?.customer_phone || invoice?.Customer?.mobile_number || '';
  const buyerAddress = invoice?.billing_address || invoice?.Customer?.address || 'Store Walk-in';
  const shippingAddress = invoice?.shipping_address || buyerAddress;
  const buyerGstin = invoice?.Customer?.gstin || invoice?.customer_gstin || '';
  const buyerState = invoice?.place_of_supply || invoice?.Customer?.state || companyState;
  
  // Dates and references
  const invDate = new Date(invoice?.invoice_date || invoice?.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  // Dynamic GST calculation
  const taxAmount = Number(invoice?.tax_amount) || 0;
  const isInterState = Number(invoice?.igst_amount || 0) > 0;
  const gstRate = Number(invoice?.gst_rate) || 0;
  const halfGstRate = (gstRate / 2);
  const igstAmount = Number(invoice?.igst_amount || (isInterState ? taxAmount : 0)).toFixed(2);
  const cgstAmount = Number(invoice?.cgst_amount || (!isInterState ? taxAmount / 2 : 0)).toFixed(2);
  const sgstAmount = Number(invoice?.sgst_amount || (!isInterState ? taxAmount / 2 : 0)).toFixed(2);
  
  const totalAmount = Number(invoice?.total_amount || invoice?.total || 0);
  const subtotal = Number(invoice?.subtotal || invoice?.amount || (totalAmount - taxAmount)) || 0;
  
  // Handle items array gracefully
  const rawItems = (invoice?.items && invoice.items.length > 0) 
    ? invoice.items 
    : ((invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : []);

  const displayItems = rawItems.length > 0 ? rawItems.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.unit_price !== undefined && item.unit_price !== '' 
      ? item.unit_price 
      : (item.amount ? Number(item.amount) / qty : (item.total ? Number(item.total) / qty : 0))) || 0;
    const total = Number(item.total !== undefined && item.total !== '' ? item.total : (qty * rate)) || 0;
    return {
      ...item,
      index: idx + 1,
      description: item.description || item.item_name || 'Item',
      hsn: item.hsn || item.hsn_code || item.product?.hsn || item.product_code || '9983',
      quantity: qty,
      unit: item.unit || 'Nos',
      unit_price: rate,
      total: total
    };
  }) : [{
    index: 1,
    description: invoice?.description || 'General Item / Sale',
    hsn: '9983',
    quantity: 1,
    unit: 'Nos',
    unit_price: subtotal,
    total: subtotal
  }];

  return (
    <div style={{
      width: '100%',
      maxWidth: '820px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      border: '1.5px solid #000000',
      boxSizing: 'border-box',
      lineHeight: '1.3'
    }}>
      {/* Top Title */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: '14px', 
        letterSpacing: '1px', 
        padding: '6px', 
        borderBottom: '1px solid #000000',
        backgroundColor: '#fcfcfc',
        textTransform: 'uppercase'
      }}>
        Tax Invoice
      </div>

      {/* Header Grid: Left = Seller details (with Logo & Profile info), Right = Invoice Meta */}
      <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
        {/* Left Side: Seller / Company Details */}
        <div style={{ width: '52%', padding: '8px 10px', borderRight: '1px solid #000000' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {companyLogo && (
              <div style={{ flexShrink: 0 }}>
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  style={{ 
                    maxHeight: '68px', 
                    maxWidth: '100px', 
                    objectFit: 'contain',
                    border: '1px solid #e2e8f0',
                    padding: '2px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff'
                  }} 
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#000' }}>
                {companyName}
              </div>
              {ownerName && (
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#111', marginTop: '1px' }}>
                  Prop: {ownerName}
                </div>
              )}
              <div style={{ marginTop: '3px', fontSize: '11px', color: '#222', lineHeight: '1.35' }}>
                {companyAddress}
              </div>
              <div style={{ marginTop: '4px' }}>
                GSTIN/UIN: <strong>{companyGst}</strong>
              </div>
              {companyPan && (
                <div>
                  PAN: <strong>{companyPan}</strong>
                </div>
              )}
              <div>
                State Name: <strong>{companyState}</strong>
              </div>
              {companyPhone && (
                <div>Contact: <strong>{companyPhone}</strong></div>
              )}
              {companyEmail && (
                <div>E-Mail: {companyEmail}</div>
              )}
              {companyWebsite && (
                <div>Website: {companyWebsite}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Invoice Meta Grid (Tally Style) */}
        <div style={{ width: '48%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'minmax(28px, auto)' }}>
          <div style={{ padding: '4px 6px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Invoice No.</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{invoice?.invoice_number || 'INV-001'}</div>
          </div>
          <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Dated</div>
            <div style={{ fontWeight: 'bold' }}>{invDate}</div>
          </div>
          
          <div style={{ padding: '4px 6px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Delivery Note</div>
            <div>{invoice?.delivery_note || '-'}</div>
          </div>
          <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Mode/Terms of Payment</div>
            <div style={{ fontWeight: 'bold' }}>{invoice?.payment_method || 'Cash / UPI'}</div>
          </div>

          <div style={{ padding: '4px 6px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Supplier's Ref.</div>
            <div>{invoice?.supplier_ref || '-'}</div>
          </div>
          <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Other Reference(s)</div>
            <div>{invoice?.payment_reference || '-'}</div>
          </div>

          <div style={{ padding: '4px 6px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Buyer's Order No.</div>
            <div>{invoice?.po_number || '-'}</div>
          </div>
          <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Order Date</div>
            <div>{invoice?.po_date ? new Date(invoice.po_date).toLocaleDateString('en-IN') : '-'}</div>
          </div>

          <div style={{ padding: '4px 6px', gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: '9px', color: '#333' }}>Terms of Delivery</div>
            <div>{invoice?.delivery_terms || 'Store Counter / Handover'}</div>
          </div>
        </div>
      </div>

      {/* Buyer & Consignee Details */}
      <div style={{ display: 'flex', borderBottom: '1px solid #000000' }}>
        {/* Consignee */}
        <div style={{ width: '52%', padding: '8px 10px', borderRight: '1px solid #000000' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#444', marginBottom: '2px' }}>
            Consignee (Ship to)
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{buyerName}</div>
          <div style={{ whiteSpace: 'pre-line', marginTop: '2px', lineHeight: '1.3' }}>
            {shippingAddress}
          </div>
          {buyerMobile && <div style={{ marginTop: '2px' }}>Mobile: <strong>{buyerMobile}</strong></div>}
          {buyerGstin && <div style={{ marginTop: '2px' }}>GSTIN/UIN: <strong>{buyerGstin}</strong></div>}
          <div style={{ marginTop: '2px' }}>State Name: <strong>{buyerState}</strong></div>
        </div>

        {/* Buyer */}
        <div style={{ width: '48%', padding: '8px 10px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#444', marginBottom: '2px' }}>
            Buyer (Bill to)
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{buyerName}</div>
          <div style={{ whiteSpace: 'pre-line', marginTop: '2px', lineHeight: '1.3' }}>
            {buyerAddress}
          </div>
          {buyerMobile && <div style={{ marginTop: '2px' }}>Mobile: <strong>{buyerMobile}</strong></div>}
          {buyerGstin && <div style={{ marginTop: '2px' }}>GSTIN/UIN: <strong>{buyerGstin}</strong></div>}
          <div style={{ marginTop: '2px' }}>State Name: <strong>{buyerState}</strong></div>
        </div>
      </div>

      {/* Item Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fafafa' }}>
            <th style={{ width: '6%', borderRight: '1px solid #000000', padding: '6px 4px' }}>Sl No.</th>
            <th style={{ width: '44%', borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'left' }}>Description of Goods</th>
            <th style={{ width: '12%', borderRight: '1px solid #000000', padding: '6px 4px' }}>HSN/SAC</th>
            <th style={{ width: '12%', borderRight: '1px solid #000000', padding: '6px 4px' }}>Quantity</th>
            <th style={{ width: '12%', borderRight: '1px solid #000000', padding: '6px 4px' }}>Rate</th>
            <th style={{ width: '6%', borderRight: '1px solid #000000', padding: '6px 2px' }}>per</th>
            <th style={{ width: '14%', padding: '6px 6px', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <tr key={idx}>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', verticalAlign: 'top' }}>
                {item.index}
              </td>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 6px', textAlign: 'left', verticalAlign: 'top', fontWeight: 'bold' }}>
                {item.description}
              </td>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', verticalAlign: 'top' }}>
                {item.hsn}
              </td>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', verticalAlign: 'top', fontWeight: 'bold' }}>
                {item.quantity} {item.unit}
              </td>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 4px', verticalAlign: 'top' }}>
                {item.unit_price.toFixed(2)}
              </td>
              <td style={{ borderRight: '1px solid #000000', padding: '5px 2px', verticalAlign: 'top' }}>
                {item.unit}
              </td>
              <td style={{ padding: '5px 6px', verticalAlign: 'top', fontWeight: 'bold', textAlign: 'right' }}>
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}

          {/* Tax Output Rows */}
          {taxAmount > 0 && (
            isInterState ? (
              <tr>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                  Output IGST ({gstRate}%)
                </td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                  {igstAmount}
                </td>
              </tr>
            ) : (
              <>
                <tr>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    Output CGST ({halfGstRate}%)
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {cgstAmount}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    Output SGST ({halfGstRate}%)
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {sgstAmount}
                  </td>
                </tr>
              </>
            )
          )}
          
          {/* Spacer row for Tally layout balance */}
          <tr>
            <td style={{ borderRight: '1px solid #000000', padding: '16px' }}></td>
            <td style={{ borderRight: '1px solid #000000' }}></td>
            <td style={{ borderRight: '1px solid #000000' }}></td>
            <td style={{ borderRight: '1px solid #000000' }}></td>
            <td style={{ borderRight: '1px solid #000000' }}></td>
            <td style={{ borderRight: '1px solid #000000' }}></td>
            <td></td>
          </tr>
          
          {/* Grand Total Row */}
          <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', backgroundColor: '#fcfcfc' }}>
            <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
              Total
            </td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', fontWeight: 'bold' }}>
              {displayItems.reduce((acc, it) => acc + it.quantity, 0)} {displayItems[0]?.unit || 'Nos'}
            </td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px' }}></td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px' }}></td>
            <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              ₹ {totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid #000000' }}>
        <div style={{ fontSize: '9px', color: '#444' }}>Amount Chargeable (in words)</div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          INR {numberToWords(Math.round(totalAmount))} Only
        </div>
      </div>

      {/* HSN/SAC Tax Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', borderBottom: '1px solid #000000', fontSize: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fafafa' }}>
            <th rowSpan="2" style={{ borderRight: '1px solid #000000', padding: '4px' }}>HSN/SAC</th>
            <th rowSpan="2" style={{ borderRight: '1px solid #000000', padding: '4px' }}>Taxable Value</th>
            {isInterState ? (
              <th colSpan="2" style={{ borderRight: '1px solid #000000', padding: '4px', borderBottom: '1px solid #000000' }}>
                Integrated Tax
              </th>
            ) : (
              <>
                <th colSpan="2" style={{ borderRight: '1px solid #000000', padding: '4px', borderBottom: '1px solid #000000' }}>
                  Central Tax
                </th>
                <th colSpan="2" style={{ borderRight: '1px solid #000000', padding: '4px', borderBottom: '1px solid #000000' }}>
                  State Tax
                </th>
              </>
            )}
            <th rowSpan="2" style={{ padding: '4px' }}>Total Tax Amount</th>
          </tr>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <th style={{ borderRight: '1px solid #000000', padding: '3px' }}>Rate</th>
            <th style={{ borderRight: '1px solid #000000', padding: '3px' }}>Amount</th>
            {!isInterState && (
              <>
                <th style={{ borderRight: '1px solid #000000', padding: '3px' }}>Rate</th>
                <th style={{ borderRight: '1px solid #000000', padding: '3px' }}>Amount</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>
              {displayItems[0]?.hsn || '9983'}
            </td>
            <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>
              {subtotal.toFixed(2)}
            </td>
            {isInterState ? (
              <>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{gstRate}%</td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{igstAmount}</td>
              </>
            ) : (
              <>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{halfGstRate}%</td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{cgstAmount}</td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{halfGstRate}%</td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{sgstAmount}</td>
              </>
            )}
            <td style={{ padding: '4px' }}>{taxAmount.toFixed(2)}</td>
          </tr>
          <tr style={{ borderTop: '1px solid #000000', fontWeight: 'bold' }}>
            <td style={{ borderRight: '1px solid #000000', padding: '4px', textAlign: 'right' }}>Total</td>
            <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{subtotal.toFixed(2)}</td>
            {isInterState ? (
              <>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{igstAmount}</td>
              </>
            ) : (
              <>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{cgstAmount}</td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '4px' }}>{sgstAmount}</td>
              </>
            )}
            <td style={{ padding: '4px' }}>{taxAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Tax Amount in Words */}
      <div style={{ padding: '5px 10px', borderBottom: '1px solid #000000' }}>
        <div style={{ fontSize: '9px', color: '#444' }}>
          Tax Amount (in words) : <strong>INR {numberToWords(Math.round(taxAmount))} Only</strong>
        </div>
      </div>

      {/* Remarks / Terms / Bank Details if available */}
      {invoice?.notes && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #000000', fontSize: '10px', backgroundColor: '#fcfcfc' }}>
          <strong>Remarks / Notes:</strong> {invoice.notes}
        </div>
      )}

      {/* Footer / Declaration and Signatures */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: '52%', padding: '8px 10px', borderRight: '1px solid #000000' }}>
          {companyPan && (
            <div style={{ marginBottom: '6px', fontSize: '10px' }}>
              Company's PAN: <strong>{companyPan}</strong>
            </div>
          )}
          <div style={{ fontSize: '9px', textDecoration: 'underline', marginBottom: '4px', fontWeight: 'bold' }}>
            Declaration
          </div>
          <div style={{ fontSize: '10px', color: '#333', lineHeight: '1.3' }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>
        </div>
        <div style={{ width: '48%', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'right' }}>
            for {companyName}
          </div>
          <div style={{ marginTop: '36px', textAlign: 'right', fontSize: '11px', fontWeight: 600 }}>
            Authorised Signatory
          </div>
        </div>
      </div>
      
      {/* Computer Generated Label */}
      <div style={{ textAlign: 'center', fontSize: '9px', color: '#444', padding: '5px', borderTop: '1px solid #000000', backgroundColor: '#fcfcfc' }}>
        This is a Computer Generated Invoice • Generated via <strong>GoBill</strong> (https://gobill.gldatacenter.com)
      </div>
    </div>
  );
};

export default TallyInvoice;
