import React, { useEffect, useState } from 'react';
import { InvoiceService } from './InvoiceService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Trash2, Eye } from 'lucide-react';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await InvoiceService.getInvoices();
        if (res.data) setInvoices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) {
    return <div className="mobile-wrapper text-center mt-4 text-muted">Loading bills...</div>;
  }

  // Filter invoices based on selected date range
  const filteredInvoices = invoices.filter(bill => {
    if (!fromDate && !toDate) return true;
    
    const billDate = new Date(bill.created_at);
    
    // Remove time portion from selected dates for accurate day comparison
    let from = fromDate ? new Date(fromDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    
    let to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    if (from && to) {
      return billDate >= from && billDate <= to;
    } else if (from) {
      return billDate >= from;
    } else if (to) {
      return billDate <= to;
    }
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await InvoiceService.deleteInvoice(deleteId);
      setInvoices(invoices.filter(i => i.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete bill:', error);
      alert('Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mobile-wrapper" style={{ marginTop: 'var(--spacing-md)' }}>
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Previous Bills</h2>
      
      {/* Date Filter */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>From Date</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-main)'
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', display: 'block' }}>To Date</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-main)'
            }}
          />
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
          {invoices.length === 0 ? 'No invoices found.' : 'No invoices found for this date range.'}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Invoice No</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((bill, index) => (
                <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', fontWeight: '500', color: 'var(--color-primary)' }}>{bill.invoice_number}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(bill.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>
                    {bill.customer_name ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{bill.customer_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{bill.customer_mobile}</div>
                      </div>
                    ) : (
                      <div style={{ fontWeight: 500 }}>{bill.customer_mobile}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap', fontWeight: '600' }}>₹{bill.total_amount}</td>
                  <td style={{ padding: '12px var(--spacing-md)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '4px 8px', 
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: bill.status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {bill.status}
                      </span>
                      {/* We'll import useNavigate and Eye icon for this View button */}
                      <button 
                        onClick={() => window.location.href = `/invoice/${bill.id}/preview`}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'var(--color-text-muted)',
                          padding: '4px'
                        }}
                        title="View Invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(bill.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        title="Delete Bill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '320px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Delete this bill?</h3>
            <p className="text-muted" style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
              This action cannot be undone. Are you sure you want to permanently delete this bill?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button type="button" onClick={handleDelete} loading={deleting} style={{ flex: 1, backgroundColor: 'var(--color-error)' }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
