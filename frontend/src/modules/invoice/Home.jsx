import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Receipt, 
  FileBarChart2, 
  Package, 
  ArrowRight, 
  Share2, 
  Eye, 
  Sparkles, 
  Calculator, 
  Search, 
  Copy, 
  Check, 
  X, 
  TrendingUp
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const QUICK_CASH_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ todaySales: 0, todayInvoices: 0 });
  const [recentBills, setRecentBills] = useState([]);
  const [company, setCompany] = useState(null);

  // New Feature States: Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Feature States: Mobile Cash Change Calculator Modal
  const [showCashCalc, setShowCashCalc] = useState(false);
  const [calcBillAmount, setCalcBillAmount] = useState('');
  const [calcCashGiven, setCalcCashGiven] = useState('');
  const [copiedBillId, setCopiedBillId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchDashboard = async () => {
      try {
        const [statsRes, billsRes, companyRes] = await Promise.all([
          api.get('/reports/dashboard').catch(() => ({ data: { todaySales: 0, todayInvoices: 0 } })),
          api.get('/invoices').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: null }))
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (billsRes.data) {
          const list = Array.isArray(billsRes.data) ? billsRes.data : (billsRes.data?.data || []);
          setRecentBills(list);
        }
        if (companyRes.data) setCompany(companyRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  const handleShareWhatsApp = (bill) => {
    const phone = bill.customer_mobile || bill.customer_phone;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const text = `*Invoice: ${bill.invoice_number}*\n` +
        `Customer: ${bill.customer_name || 'Customer'}\n` +
        `Date: ${new Date(bill.created_at).toLocaleDateString()}\n` +
        `*Amount: ₹${Number(bill.total_amount).toFixed(2)}*\n` +
        `Thank you for doing business with us!`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
      toast.success('Opening WhatsApp...');
    } else {
      toast.error('Customer phone number not available');
    }
  };

  // New Feature: 1-Tap Copy Bill Details to Clipboard
  const handleCopyBillSummary = (bill) => {
    const text = `Invoice #${bill.invoice_number} | Customer: ${bill.customer_name || 'Walk-in'} | Total: ₹${Number(bill.total_amount).toFixed(2)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBillId(bill.id);
      toast.success('Bill summary copied to clipboard!');
      setTimeout(() => setCopiedBillId(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const businessName = company?.company_name || user?.name || 'GoBill';

  // Average Sale Value Calculation
  const avgBillValue = stats.todayInvoices > 0 
    ? (Number(stats.todaySales || 0) / Number(stats.todayInvoices || 1)).toFixed(0) 
    : '0';

  // Filtered bills for real-time mobile search
  const filteredRecentBills = recentBills.filter(bill => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const invNo = (bill.invoice_number || '').toLowerCase();
    const name = (bill.customer_name || '').toLowerCase();
    const phone = (bill.customer_mobile || bill.customer_phone || '');
    return invNo.includes(q) || name.includes(q) || phone.includes(q);
  });

  // Limit to 5 recent invoices for dashboard view
  const displayedBills = filteredRecentBills.slice(0, 5);

  // Calculate Cash Change Due
  const billTotalNum = parseFloat(calcBillAmount) || 0;
  const cashGivenNum = parseFloat(calcCashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - billTotalNum);

  return (
    <div className="billing-inner-wrap home-dashboard-wrap">
      {/* Hero Card with Vibrant Attractive Green Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #10b981 100%)',
        borderRadius: '18px',
        padding: '16px 18px',
        color: '#ffffff',
        marginBottom: '16px',
        boxShadow: '0 8px 22px -3px rgba(5, 150, 105, 0.32), 0 3px 8px -2px rgba(15, 23, 42, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow circles */}
        <div style={{
          position: 'absolute',
          right: '-25px',
          top: '-25px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          left: '30%',
          bottom: '-30px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(167, 243, 208, 0.3) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ 
              fontSize: '0.72rem', 
              color: '#a7f3d0', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              fontWeight: 700 
            }}>
              {getGreeting()}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '3px 0 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
              {businessName}
            </h2>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(6px)',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(255, 255, 255, 0.35)'
          }}>
            <Sparkles size={12} />
            <span>POS Ready</span>
          </div>
        </div>

        {/* Stats Grid with 3 Business Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.22)',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <p style={{ fontSize: '0.68rem', color: '#d1fae5', margin: 0, fontWeight: 500 }}>Today's Sales</p>
            <div style={{ 
              fontSize: '1.15rem', 
              fontWeight: 800, 
              marginTop: '2px', 
              color: '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              ₹{Number(stats.todaySales || 0).toFixed(0)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.68rem', color: '#d1fae5', margin: 0, fontWeight: 500 }}>Bills Issued</p>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: '#ffffff' }}>
              {stats.todayInvoices || 0}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.68rem', color: '#d1fae5', margin: 0, fontWeight: 500 }}>Avg / Bill</p>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: '#ffffff' }}>
              ₹{avgBillValue}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bills Section with Live Search */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Recent Invoices
          </h3>
          <span 
            style={{ 
              color: 'var(--color-primary)', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}
            onClick={() => navigate('/bills')}
          >
            <span>See All ({recentBills.length})</span>
            <ArrowRight size={14} />
          </span>
        </div>

        {/* Live Search Bar for Mobile */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search bills by invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 34px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-main)',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {displayedBills.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem'
          }}>
            {searchQuery ? 'No matching invoices found for your search.' : 'No invoices generated yet. Tap the button above to create your first bill!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedBills.map(bill => (
              <div 
                key={bill.id} 
                className="mobile-bill-card" 
                style={{ padding: '14px', marginBottom: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {bill.invoice_number}
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {bill.customer_name || 'Walk-in Customer'} • {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                      ₹{Number(bill.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px', 
                  marginTop: '10px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--color-border-subtle)' 
                }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/invoice/${bill.id}/preview`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px'
                    }}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  {/* 1-Tap Copy Summary Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyBillSummary(bill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedBillId === bill.id ? 'var(--color-success)' : 'var(--color-text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px'
                    }}
                  >
                    {copiedBillId === bill.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedBillId === bill.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(bill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-success)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px'
                    }}
                  >
                    <Share2 size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}

            {recentBills.length > 5 && !searchQuery && (
              <button
                type="button"
                onClick={() => navigate('/bills')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1.5px dashed var(--color-border)',
                  borderRadius: '12px',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <span>View All Invoices ({recentBills.length})</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Feature: Cash Change Calculator Modal / Drawer */}
      {showCashCalc && (
        <div 
          className="summary-sheet-overlay" 
          onClick={() => setShowCashCalc(false)}
          style={{ zIndex: 90 }}
        >
          <div 
            className="summary-sheet-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '20px' }}
          >
            <div className="summary-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-warning-light)',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-warning)'
                }}>
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                    Cash Change Calculator
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Instant change calculation</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCashCalc(false)}
                style={{
                  background: 'var(--color-bg-subtle)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Inputs */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Bill Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={calcBillAmount}
                onChange={(e) => setCalcBillAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  outline: 'none',
                  color: 'var(--color-text-main)',
                  backgroundColor: 'var(--color-bg-card)'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Cash Given by Customer (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={calcCashGiven}
                onChange={(e) => setCalcCashGiven(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  outline: 'none',
                  color: 'var(--color-text-main)',
                  backgroundColor: 'var(--color-bg-card)'
                }}
              />

              {/* Quick Cash Note Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {QUICK_CASH_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCalcCashGiven(amt.toString())}
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Due Display */}
            <div style={{
              background: changeDue > 0 ? 'var(--color-success-light)' : 'var(--color-bg-subtle)',
              border: `1.5px solid ${changeDue > 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-border)'}`,
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: changeDue > 0 ? 'var(--color-success-hover)' : 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                Change to Return
              </span>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: changeDue > 0 ? 'var(--color-success-hover)' : 'var(--color-text-main)',
                marginTop: '4px'
              }}>
                ₹{changeDue.toFixed(2)}
              </div>
            </div>

            {/* Close / Action Button */}
            <button
              type="button"
              onClick={() => setShowCashCalc(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
