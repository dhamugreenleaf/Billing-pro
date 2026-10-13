import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, Download, Printer } from 'lucide-react';
import api from '../../utils/api';

const Reports = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Build query params
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (customerName) params.append('customerName', customerName);
        if (customerMobile) params.append('customerMobile', customerMobile);
        
        const res = await api.get(`/reports/dashboard?${params.toString()}`);
        if (res.data) {
          setStats(res.data);
          setInvoices(res.data.invoices || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce to avoid hitting API on every keystroke
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fromDate, toDate, customerName, customerMobile]);

  if (loading && !stats) return <div className="mobile-wrapper text-center mt-4 text-muted">Loading reports...</div>;

  return (
    <div className="mobile-wrapper" style={{ marginTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-xl)' }}>
      <style>{`
        .print-only {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          /* Premium table styling for print */
          .print-section table {
            border: 1px solid #e2e8f0;
          }
          .print-section th {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ margin: 0 }}>Reports Overview</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>From Date</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', outline: 'none', backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-main)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>To Date</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', outline: 'none', backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-main)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>Customer Name</label>
            <input 
              type="text" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Search by name"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', outline: 'none', backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-main)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>Mobile Number</label>
            <input 
              type="text" 
              value={customerMobile} 
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Search by mobile"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', outline: 'none', backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-main)' }}
            />
          </div>
        </div>
      </div>
      
      {loading && !stats ? (
        <div className="text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>Loading reports...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="card text-center">
              <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Period Sales</p>
              <h3 style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-primary)' }}>₹{stats?.todaySales || 0}</h3>
            </div>
            <div className="card text-center">
              <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Period Bills</p>
              <h3 style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-primary)' }}>{stats?.todayInvoices || 0}</h3>
            </div>
        <div className="card text-center">
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Monthly Sales</p>
          <h3 style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-primary)' }}>₹{stats?.monthlySales || 0}</h3>
        </div>
        <div className="card text-center no-print">
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Pending Dues</p>
          <h3 style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-warning)' }}>₹{stats?.pendingAmount || 0}</h3>
        </div>
      </div>

      <div className="print-section">
        {/* Premium Print Header (Only visible when printing) */}
        <div className="print-only" style={{ marginBottom: '30px', borderBottom: '2px solid var(--color-primary)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ color: 'var(--color-primary)', margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>{stats?.company?.company_name || 'GoBill'}</h1>
              <p style={{ margin: '0 0 4px 0', color: '#4b5563', fontSize: '14px' }}>{stats?.company?.address || 'Your Business Address'}</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>Phone: {stats?.company?.mobile_number || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#1f2937', fontWeight: 'bold' }}>{customerName || customerMobile ? 'CUSTOMER REPORT' : 'SALES REPORT'}</h2>
              {(customerName || customerMobile) && (
                <>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#4b5563' }}>
                    <strong style={{ color: '#1f2937' }}>Customer:</strong> {customerName || (invoices.length > 0 ? invoices.find(inv => inv.customer_name)?.customer_name : null) || 'N/A'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#4b5563' }}>
                    <strong style={{ color: '#1f2937' }}>Mobile:</strong> {customerMobile || (invoices.length > 0 ? invoices.find(inv => inv.customer_mobile)?.customer_mobile : null) || 'N/A'}
                  </p>
                </>
              )}
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#4b5563' }}>
                <strong style={{ color: '#1f2937' }}>Total Invoices:</strong> {invoices.length}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                <strong style={{ color: '#1f2937' }}>Date Range:</strong> {
                  (() => {
                    if (invoices.length === 0) return 'N/A';
                    const dates = invoices.map(inv => new Date(inv.created_at).getTime());
                    const minDate = new Date(Math.min(...dates)).toLocaleDateString();
                    const maxDate = new Date(Math.max(...dates)).toLocaleDateString();
                    return minDate === maxDate ? minDate : `${minDate} - ${maxDate}`;
                  })()
                }
              </p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Sales</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₹{stats?.todaySales || 0}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Invoices</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats?.todayInvoices || 0}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Monthly Sales</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₹{stats?.monthlySales || 0}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Pending Dues</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>₹{stats?.pendingAmount || 0}</p>
            </div>
          </div>
        </div>

        {/* Customer Summary Section (Screen only) */}
        {(customerName || customerMobile) && stats && (
          <div className="card no-print" style={{ marginBottom: 'var(--spacing-md)', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--color-primary)' }}>Customer Report</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 'var(--font-size-sm)' }}>
                  <span className="text-muted">Customer:</span>
                  <span style={{ fontWeight: 600 }}>{customerName || (invoices.length > 0 ? invoices.find(inv => inv.customer_name)?.customer_name : null) || 'N/A'}</span>
                  
                  <span className="text-muted">Mobile:</span>
                  <span style={{ fontWeight: 600 }}>{customerMobile || (invoices.length > 0 ? invoices.find(inv => inv.customer_mobile)?.customer_mobile : null) || 'N/A'}</span>
                  
                  <span className="text-muted">Invoices Found:</span>
                  <span style={{ fontWeight: 600 }}>{invoices.length}</span>
                  
                  <span className="text-muted">Total Sales:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>₹{stats.todaySales || 0}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {invoices.length > 0 && invoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{inv.invoice_number}</span>
                    <span className="text-muted">({new Date(inv.created_at).toLocaleDateString()})</span>
                    <button 
                      onClick={() => window.open(`/invoice/${inv.id}/preview`, '_blank')}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        padding: '4px', color: 'var(--color-text-main)',
                        display: 'flex', alignItems: 'center'
                      }}
                      title="View Invoice"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
                
                <button 
                  className="no-print"
                  onClick={() => window.print()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: 'var(--color-primary)', color: 'white',
                    border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontWeight: 500, fontSize: '14px',
                    marginTop: invoices.length > 0 ? '8px' : '0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <Download size={16} />
                  Download Report as PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <h3 className="no-print" style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>Recent Invoices</h3>
      {invoices.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
          No invoices match the selected date range or customer filters.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Invoice</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Mobile</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>GST</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total</th>
                <th className="no-print" style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((bill, index) => (
                <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: index % 2 === 0 ? 'var(--color-bg-card, #ffffff)' : 'var(--color-bg-subtle, #f9fafb)' }}>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', fontWeight: '500', color: 'var(--color-primary)' }}>{bill.invoice_number}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(bill.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 500 }}>{bill.customer_name || '-'}</div>
                  </td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>
                    <div style={{ color: 'var(--color-text-muted)' }}>{bill.customer_mobile || '-'}</div>
                  </td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>₹{bill.taxable_amount || 0}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>₹{bill.tax_amount || 0}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', fontWeight: '600' }}>₹{bill.total_amount}</td>
                  <td className="no-print" style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => window.open(`/invoice/${bill.id}/preview?print=true`, '_blank')}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'var(--color-primary)',
                          padding: '4px'
                        }}
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
      </>
      )}
    </div>
  );
};

export default Reports;
