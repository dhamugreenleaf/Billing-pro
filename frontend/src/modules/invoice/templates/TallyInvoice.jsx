import React from 'react';
import { numberToWords } from '../../../utils/numberToWords';

const TallyInvoice = ({ invoice }) => {
  if (!invoice) return null;

  const { Company, items } = invoice;
  const companyName = Company?.company_name || 'Your Company Name';
  const companyAddress = Company?.address || 'Address Line 1, City, State';
  const companyState = Company?.state || 'State';
  const companyGst = Company?.gst_number || 'Unregistered';
  const companyEmail = Company?.email || '';
  const companyPhone = Company?.phone || '';
  
  const buyerName = invoice.customer_name || 'Cash Customer';
  const buyerMobile = invoice.customer_mobile || '';
  const buyerAddress = invoice.Customer?.address || '';
  
  // Use DB generated invoice_date if available
  const invDate = new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  // Calculate SGST and CGST (assuming 18% total for simplicity if not using items, or use total tax)
  const taxAmount = Number(invoice.tax_amount) || 0;
  const halfTax = (taxAmount / 2).toFixed(2);
  const totalAmount = Number(invoice.total_amount) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  
  // Simple mapping for one item if items array is empty
  const displayItems = items && items.length > 0 ? items : [{
    description: invoice.description,
    hsn: '9983', // Default service code
    quantity: 1,
    unit: 'Nos',
    rate: subtotal,
    amount: subtotal
  }];

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      border: '1px solid #000',
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px', borderBottom: '1px solid #000' }}>
        Tax Invoice
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
        {/* Left Side - Seller Details */}
        <div style={{ width: '50%', padding: '10px', borderRight: '1px solid #000' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {Company?.logo && (
              <img src={Company.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{companyName}</div>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>{companyAddress}</div>
              <div style={{ marginTop: '5px' }}>GSTIN/UIN: <strong>{companyGst}</strong></div>
              <div>State Name: {companyState}</div>
              {companyPhone && <div>Mobile: {companyPhone}</div>}
              {companyEmail && <div>E-Mail: {companyEmail}</div>}
            </div>
          </div>
        </div>

        {/* Right Side - Invoice Details Grid */}
        <div style={{ width: '50%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(5, 1fr)' }}>
          <div style={{ padding: '4px 8px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Invoice No.</div>
            <div style={{ fontWeight: 'bold' }}>{invoice.invoice_number}</div>
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Dated</div>
            <div style={{ fontWeight: 'bold' }}>{invDate}</div>
          </div>
          
          <div style={{ padding: '4px 8px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Delivery Note</div>
            <div></div>
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Mode/Terms of Payment</div>
            <div style={{ fontWeight: 'bold' }}>{invoice.payment_method}</div>
          </div>

          <div style={{ padding: '4px 8px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Supplier's Ref.</div>
            <div></div>
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Other Reference(s)</div>
            <div></div>
          </div>

          <div style={{ padding: '4px 8px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Buyer's Order No.</div>
            <div></div>
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #000' }}>
            <div style={{ fontSize: '10px' }}>Dated</div>
            <div></div>
          </div>

          <div style={{ padding: '4px 8px', borderRight: '1px solid #000', gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: '10px' }}>Terms of Delivery</div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Buyer Details */}
      <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
        <div style={{ width: '50%', padding: '10px', borderRight: '1px solid #000' }}>
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>Consignee (Ship to)</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{buyerName}</div>
          {buyerAddress && <div style={{ whiteSpace: 'pre-line', marginTop: '2px' }}>{buyerAddress}</div>}
          <div style={{ marginTop: '2px' }}>{buyerMobile && `Mobile: ${buyerMobile}`}</div>
        </div>
        <div style={{ width: '50%', padding: '10px' }}>
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>Buyer (Bill to)</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{buyerName}</div>
          {buyerAddress && <div style={{ whiteSpace: 'pre-line', marginTop: '2px' }}>{buyerAddress}</div>}
          <div style={{ marginTop: '2px' }}>{buyerMobile && `Mobile: ${buyerMobile}`}</div>
        </div>
      </div>

      {/* Item Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ width: '5%', borderRight: '1px solid #000', padding: '5px' }}>Sl No.</th>
            <th style={{ width: '45%', borderRight: '1px solid #000', padding: '5px' }}>Description of Goods</th>
            <th style={{ width: '10%', borderRight: '1px solid #000', padding: '5px' }}>HSN/SAC</th>
            <th style={{ width: '10%', borderRight: '1px solid #000', padding: '5px' }}>Quantity</th>
            <th style={{ width: '15%', borderRight: '1px solid #000', padding: '5px' }}>Rate</th>
            <th style={{ width: '5%', borderRight: '1px solid #000', padding: '5px' }}>per</th>
            <th style={{ width: '10%', padding: '5px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <tr key={idx}>
              <td style={{ borderRight: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{idx + 1}</td>
              <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'left', verticalAlign: 'top', fontWeight: 'bold' }}>{item.description}</td>
              <td style={{ borderRight: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{item.hsn}</td>
              <td style={{ borderRight: '1px solid #000', padding: '5px', verticalAlign: 'top', fontWeight: 'bold' }}>{item.quantity} {item.unit}</td>
              <td style={{ borderRight: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{Number(item.rate).toFixed(2)}</td>
              <td style={{ borderRight: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{item.unit}</td>
              <td style={{ padding: '5px', verticalAlign: 'top', fontWeight: 'bold', textAlign: 'right' }}>{Number(item.amount).toFixed(2)}</td>
            </tr>
          ))}
          {taxAmount > 0 && (
            <>
              <tr>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Output CGST</td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{halfTax}</td>
              </tr>
              <tr>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Output SGST</td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
                <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{halfTax}</td>
              </tr>
            </>
          )}
          
          {/* Spacer row to push totals down if needed */}
          <tr>
            <td style={{ borderRight: '1px solid #000', padding: '20px' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td></td>
          </tr>
          
          <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
            <td colSpan="3" style={{ borderRight: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
            <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>₹ {totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <div style={{ padding: '5px 10px', borderBottom: '1px solid #000' }}>
        <div style={{ fontSize: '10px' }}>Amount Chargeable (in words)</div>
        <div style={{ fontWeight: 'bold' }}>INR {numberToWords(Math.round(totalAmount))}</div>
      </div>

      {/* HSN/SAC Tax Table (Simplified) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', borderBottom: '1px solid #000' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th rowSpan="2" style={{ borderRight: '1px solid #000', padding: '5px' }}>HSN/SAC</th>
            <th rowSpan="2" style={{ borderRight: '1px solid #000', padding: '5px' }}>Taxable Value</th>
            <th colSpan="2" style={{ borderRight: '1px solid #000', padding: '5px', borderBottom: '1px solid #000' }}>Central Tax</th>
            <th colSpan="2" style={{ borderRight: '1px solid #000', padding: '5px', borderBottom: '1px solid #000' }}>State Tax</th>
            <th rowSpan="2" style={{ padding: '5px' }}>Total Tax Amount</th>
          </tr>
          <tr>
            <th style={{ borderRight: '1px solid #000', padding: '5px' }}>Rate</th>
            <th style={{ borderRight: '1px solid #000', padding: '5px' }}>Amount</th>
            <th style={{ borderRight: '1px solid #000', padding: '5px' }}>Rate</th>
            <th style={{ borderRight: '1px solid #000', padding: '5px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>9983</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>{subtotal.toFixed(2)}</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>9%</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>{halfTax}</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>9%</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}>{halfTax}</td>
            <td style={{ padding: '5px' }}>{taxAmount.toFixed(2)}</td>
          </tr>
          <tr style={{ borderTop: '1px solid #000' }}>
            <td style={{ borderRight: '1px solid #000', padding: '5px', fontWeight: 'bold', textAlign: 'right' }}>Total</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{subtotal.toFixed(2)}</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
            <td style={{ borderRight: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{halfTax}</td>
            <td style={{ borderRight: '1px solid #000', padding: '5px' }}></td>
            <td style={{ borderRight: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{halfTax}</td>
            <td style={{ padding: '5px', fontWeight: 'bold' }}>{taxAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ padding: '5px 10px', borderBottom: '1px solid #000' }}>
        <div style={{ fontSize: '10px' }}>Tax Amount (in words) : <strong>INR {numberToWords(Math.round(taxAmount))}</strong></div>
      </div>

      {/* Footer / Declaration */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%', padding: '10px', borderRight: '1px solid #000' }}>
          <div style={{ fontSize: '10px', textDecoration: 'underline', marginBottom: '5px' }}>Declaration</div>
          <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
        </div>
        <div style={{ width: '50%', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 'bold' }}>for {companyName}</div>
          <div style={{ marginTop: '40px' }}>Authorised Signatory</div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', fontSize: '10px', padding: '5px', borderTop: '1px solid #000' }}>
        This is a Computer Generated Invoice
      </div>
    </div>
  );
};

export default TallyInvoice;
