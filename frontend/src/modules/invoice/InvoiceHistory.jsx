import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceService } from './InvoiceService';
import Button from '../../components/Button';
import { Trash2, Eye, Share2, Search, Plus, Calendar, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
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
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧾</div>
        Loading bills...
      </div>
    );
  }

  // Filter invoices based on search, status, and date range
  const filteredInvoices = invoices.filter(bill => {
    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchInv = bill.invoice_number && bill.invoice_number.toLowerCase().includes(term);
      const matchName = bill.customer_name && bill.customer_name.toLowerCase().includes(term);
      const matchPhone = bill.customer_mobile && bill.customer_mobile.includes(term);
      if (!matchInv && !matchName && !matchPhone) return false;
    }


    // Date Filter
    if (fromDate || toDate) {
      const billDate = new Date(bill.created_at);
      let from = fromDate ? new Date(fromDate) : null;
      if (from) from.setHours(0, 0, 0, 0);
      let to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      if (from && to) {
        if (billDate < from || billDate > to) return false;
      } else if (from) {
        if (billDate < from) return false;
      } else if (to) {
        if (billDate > to) return false;
      }
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
      toast.success('Bill deleted successfully');
    } catch (error) {
      console.error('Failed to delete bill:', error);
      toast.error('Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  const handleShareWhatsApp = (bill) => {
    const phone = bill.customer_mobile || bill.customer_phone;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const text = `*Invoice: ${bill.invoice_number}*\n` +
        `Customer: ${bill.customer_name || 'Customer'}\n` +
        `Date: ${new Date(bill.created_at).toLocaleDateString()}\n` +
        `*Amount: ₹${Number(bill.total_amount).toFixed(2)}*\n` +
        `Thank you for doing business with us!\n\n` +
        `Generated via GoBill • https://gobill.gldatacenter.com`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
      toast.success('Opening WhatsApp...');
    } else {
      toast.error('Customer phone number not available');
    }
  };

  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
  const totalDue = Math.max(totalRevenue - totalCollected, 0);

  return (
    <div className="billing-inner-wrap home-dashboard-wrap">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            Bills & Register
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            {invoices.length} {invoices.length === 1 ? 'Bill issued' : 'Bills issued'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/invoice/new')}
          style={{
            background: 'var(--gradient-brand, linear-gradient(135deg, #059669 0%, #10b981 100%))',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
            transition: 'all 0.15s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} />
          <span>New Bill</span>
        </button>
      </div>

      {/* Summary Financial Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '14px'
      }}>
        <div style={{ backgroundColor: 'var(--color-bg-card, #ffffff)', borderRadius: '14px', border: '1.5px solid var(--color-border, #c4e7d4)', padding: '12px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(6, 78, 59, 0.05)' }}>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 800 }}>Total Sales</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-main)', marginTop: '2px' }}>₹{totalRevenue.toFixed(0)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--color-bg-card, #ffffff)', borderRadius: '14px', border: '1.5px solid var(--color-border, #c4e7d4)', padding: '12px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(6, 78, 59, 0.05)' }}>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#059669', fontWeight: 800 }}>Bills Issued</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{invoices.length}</div>
        </div>
        <div style={{ backgroundColor: 'var(--color-bg-card, #ffffff)', borderRadius: '14px', border: '1.5px solid var(--color-border, #c4e7d4)', padding: '12px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(6, 78, 59, 0.05)' }}>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#4f46e5', fontWeight: 800 }}>Avg / Bill</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#4f46e5', marginTop: '2px' }}>₹{invoices.length ? (totalRevenue / invoices.length).toFixed(0) : 0}</div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
        <input 
          type="text"
          placeholder="Search by invoice #, customer name, mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 36px 10px 36px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-main)',
            outline: 'none'
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Date Filter Bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setShowDateFilter(!showDateFilter)}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            border: fromDate || toDate ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: fromDate || toDate ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
            color: fromDate || toDate ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Calendar size={14} />
          <span>{fromDate || toDate ? 'Date Filter Active' : 'Filter by Date'}</span>
        </button>
      </div>

      {/* Date Filter Panel */}
      {showDateFilter && (
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              From Date
            </label>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-main)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              To Date
            </label>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-main)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>

          {(fromDate || toDate) && (
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-error)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Date Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredInvoices.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--color-border)',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧾</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 6px' }}>
            No bills found
          </h3>
          <p style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>
            {invoices.length === 0 ? 'Create your first professional invoice now!' : 'No invoices matched your filters.'}
          </p>
          <Button onClick={() => navigate('/invoice/new')} style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
            Create New Bill
          </Button>
        </div>
      ) : (
        <div>
          {/* MOBILE CARDS VIEW (Displayed on screens < 768px via media query or default flex) */}
          <div className="mobile-cards-list">
            {filteredInvoices.map(bill => {
              const billStatus = (bill.payment_status || bill.status || 'unpaid').toLowerCase();
              const isBillPaid = billStatus === 'paid';
              const isBillPartial = billStatus === 'partial';

              return (
                <div key={bill.id} className="mobile-bill-card">
                  <div className="mobile-bill-top">
                    <div>
                      <h3 className="mobile-bill-number">{bill.invoice_number}</h3>
                      <div className="mobile-bill-date">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mobile-bill-amount">
                        ₹{Number(bill.total_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="mobile-bill-customer">
                    <span>👤</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bill.customer_name || 'Customer'}
                      </div>
                      {bill.customer_mobile && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {bill.customer_mobile}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mobile-bill-actions">
                    <button
                      type="button"
                      className="mobile-bill-action-btn"
                      onClick={() => navigate(`/invoice/${bill.id}/preview`)}
                    >
                      <Eye size={15} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      className="mobile-bill-action-btn whatsapp"
                      onClick={() => handleShareWhatsApp(bill)}
                    >
                      <Share2 size={15} />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      className="mobile-bill-action-btn"
                      onClick={() => setDeleteId(bill.id)}
                      style={{ color: '#ef4444', maxWidth: '40px' }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Displayed on screens >= 768px) */}
          <div className="desktop-table-view d-none d-md-block" style={{ marginTop: '14px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Invoice #</th>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((bill, index) => {
                    const billStatus = (bill.payment_status || bill.status || 'unpaid').toLowerCase();
                    const isBillPaid = billStatus === 'paid';
                    const isBillPartial = billStatus === 'partial';

                    return (
                      <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border-subtle, #f1f5f9)', backgroundColor: index % 2 === 0 ? 'var(--color-bg-card, #ffffff)' : 'var(--color-bg-subtle, #fafafa)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary, #1e3a8a)' }}>
                          {bill.invoice_number}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted, #64748b)' }}>
                          {new Date(bill.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main, #0f172a)' }}>{bill.customer_name || 'Customer'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>{bill.customer_mobile}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-text-main, #0f172a)' }}>
                          ₹{Number(bill.total_amount).toFixed(2)}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/invoice/${bill.id}/preview`)}
                              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                              title="View Invoice"
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(bill)}
                              style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: '4px' }}
                              title="Share on WhatsApp"
                            >
                              <Share2 size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(bill.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Delete"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="summary-sheet-overlay">
          <div className="summary-sheet-card" style={{ maxWidth: '360px', borderRadius: '16px', margin: 'auto' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Delete this bill?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 20px' }}>
              This invoice will be permanently removed. This action cannot be reversed.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleDelete} 
                loading={deleting} 
                style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
