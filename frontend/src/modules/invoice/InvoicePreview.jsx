import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { InvoiceService } from './InvoiceService';
import TallyInvoice from './templates/TallyInvoice';
import AdvancedInvoice from './templates/AdvancedInvoice';
import BasicInvoice from './templates/BasicInvoice';
import RetailInvoice from './templates/RetailInvoice';
import WholesaleInvoice from './templates/WholesaleInvoice';
import ServiceInvoice from './templates/ServiceInvoice';
import ClassicInvoice from './templates/ClassicInvoice';
import ModernInvoice from './templates/ModernInvoice';
import ProformaInvoice from './templates/ProformaInvoice';
import PremiumInvoice from './templates/PremiumInvoice';
import Button from '../../components/Button';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CreditCard, 
  CheckCircle2, 
  Smartphone, 
  FileText, 
  Palette, 
  Copy,
  Receipt,
  User,
  Check,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const ALL_FORMAT_OPTIONS = [
  { id: 'tally', name: 'Tally Style (GST)', icon: '📊', desc: 'Official Tally Prime Format' },
  { id: 'standard', name: 'Standard A4', icon: '📄', desc: 'Corporate Tax Invoice' },
  { id: 'retail', name: 'Retail POS', icon: '🧾', desc: 'Compact Retail Slip' },
  { id: 'modern', name: 'Modern Tax', icon: '🎨', desc: 'Clean Modern Layout' },
  { id: 'classic', name: 'Classic Memo', icon: '📜', desc: 'Traditional Cash Memo' },
  { id: 'wholesale', name: 'Wholesale B2B', icon: '📦', desc: 'Wholesale & Distribution' },
  { id: 'advanced', name: 'Advanced GST', icon: '⚡', desc: 'Detailed GST Audit' },
  { id: 'service', name: 'Service Bill', icon: '💼', desc: 'Professional Services' },
  { id: 'premium', name: 'Premium Luxury', icon: '✨', desc: 'Executive Styling' },
  { id: 'proforma', name: 'Proforma', icon: '📋', desc: 'Proforma / Quotation' }
];

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get('template');
  const chooseFromUrl = searchParams.get('choose') === 'true';
  const { user } = useSelector((state) => state.auth);

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState([]);
  
  // Mobile / Desktop View Mode: default to 'print' (A4 Document) so user immediately sees the invoice format!
  const [viewMode, setViewMode] = useState('print');

  // States for format selection
  const [showFormatSelection, setShowFormatSelection] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(templateFromUrl || 'tally'); 
  const [savingFormat, setSavingFormat] = useState(false);

  // States for payment recording
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAutoPrint = searchParams.get('print') === 'true';

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const [res, formatsRes, companyRes] = await Promise.all([
          InvoiceService.getInvoiceById(id),
          api.get('/subscription/invoice-formats').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: null }))
        ]);
        if (res.data) {
          setInvoice(res.data);
          const rawTpl = templateFromUrl || res.data.invoice_template || 'tally';
          const activeTpl = (rawTpl === 'normal' || !rawTpl) ? 'standard' : rawTpl;
          setSelectedFormat(activeTpl);
        }
        if (formatsRes.data) {
          setFormats(formatsRes.data);
        }
        if (companyRes.data) {
          setCompany(companyRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceData();
  }, [id, templateFromUrl]);

  useEffect(() => {
    if (invoice && isAutoPrint && !showFormatSelection) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, isAutoPrint, showFormatSelection]);

  const handlePrint = () => {
    if (viewMode !== 'print') {
      setViewMode('print');
      setTimeout(() => {
        window.print();
      }, 250);
    } else {
      window.print();
    }
  };

  const handleSwitchFormat = async (tplId) => {
    setSelectedFormat(tplId);
    setViewMode('print');
    setShowFormatSelection(false);
    navigate(`/invoice/${id}/preview?template=${tplId}`, { replace: true });
    try {
      await InvoiceService.updateInvoiceTemplate(id, tplId);
      setInvoice(prev => ({ ...prev, invoice_template: tplId }));
      const tplName = ALL_FORMAT_OPTIONS.find(t => t.id === tplId)?.name || tplId.toUpperCase();
      toast.success(`Generated in ${tplName}`);
    } catch (err) {
      console.error('Failed to save template selection', err);
    }
  };

  const handleConfirmFormat = async () => {
    await handleSwitchFormat(selectedFormat);
  };

  const handleShareWhatsApp = () => {
    const phone = invoice.customer_mobile || invoice.customer_phone || invoice.Customer?.mobile_number;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      const items = (invoice.InvoiceItems || invoice.items || []);
      const itemsList = items
        .map((it, idx) => `• ${it.description || it.item_name} (x${it.quantity || 1}): ₹${Number(it.total || (it.unit_price * (it.quantity || 1)) || 0).toFixed(2)}`)
        .join('\n');
      
      const text = `🧾 *INVOICE FROM ${company?.company_name?.toUpperCase() || 'GOBILL'}*\n\n` +
        `Dear ${invoice.customer_name || 'Customer'},\n` +
        `Thank you for your business. Here is your bill summary:\n\n` +
        `📄 *Invoice No:* ${invoice.invoice_number}\n` +
        `📅 *Date:* ${new Date(invoice.created_at || invoice.invoice_date).toLocaleDateString()}\n` +
        `--------------------------------\n` +
        `${itemsList}\n` +
        `--------------------------------\n` +
        `💰 *Grand Total: ₹${Number(invoice.total_amount || invoice.total || 0).toFixed(2)}*\n\n` +
        `Thank you for doing business with us! Have a great day.\n\n` +
        `Generated via GoBill • https://gobill.gldatacenter.com`;
      
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
      toast.success('Opening WhatsApp...');
    } else {
      toast.error('Customer phone number not available');
    }
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    toast.success('Invoice link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    const currentPaid = parseFloat(invoice.paid_amount || 0);
    const total = parseFloat(invoice.total_amount || 0);
    const remaining = total - currentPaid;
    if (amt > remaining + 0.001) {
      toast.error(`Payment amount cannot exceed remaining balance (₹${remaining.toFixed(2)})`);
      return;
    }

    setRecordingPayment(true);
    try {
      const res = await InvoiceService.recordPayment(id, {
        amount: amt,
        payment_method: paymentMethod,
        payment_reference: paymentRef.trim() || null,
        notes: paymentNotes.trim() || null
      });

      const updatedInv = res.data?.invoice || {};
      setInvoice(prev => ({
        ...prev,
        paid_amount: updatedInv.paid_amount !== undefined ? updatedInv.paid_amount : prev.paid_amount,
        payment_status: updatedInv.payment_status || prev.payment_status,
        status: updatedInv.status || prev.status,
        payment_method: updatedInv.payment_method || prev.payment_method
      }));

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      toast.success('Payment recorded successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚡</div>
        Loading digital invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444' }}>
        Invoice not found.
      </div>
    );
  }

  const items = invoice.InvoiceItems || invoice.items || [];
  const currentPaid = parseFloat(invoice.paid_amount || 0);
  const totalAmount = parseFloat(invoice.total_amount || invoice.total || 0);
  const balanceDue = Math.max(totalAmount - currentPaid, 0);
  const isPaid = (invoice.payment_status === 'paid' || invoice.status === 'paid' || balanceDue <= 0.01);
  const isPartial = !isPaid && currentPaid > 0;

  const mergedCompany = {
    ...(invoice?.Company || {}),
    ...(company || {})
  };

  const displayInvoice = {
    ...invoice,
    items: (invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : (invoice?.items || []),
    InvoiceItems: (invoice?.InvoiceItems && invoice.InvoiceItems.length > 0) ? invoice.InvoiceItems : (invoice?.items || []),
    Company: mergedCompany
  };

  // Real-time UPI QR Code URL
  const merchantUpi = (mergedCompany?.phone || company?.phone) ? `${mergedCompany?.phone || company.phone}@upi` : 'merchant@upi';
  const upiPayload = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(mergedCompany?.company_name || 'GoBill')}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${invoice.invoice_number}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}`;

  // MAIN PREVIEW SCREEN
  return (
    <div className="billing-mobile-page preview-mode">
      {/* Top Header */}
      <header className="billing-mobile-header no-print">
        <div className="billing-header-left">
          <button 
            type="button" 
            className="billing-back-btn" 
            onClick={() => navigate('/bills')}
            title="Go to Bills"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="billing-header-title">{invoice.invoice_number}</h1>
            <p className="billing-header-subtitle">
              <span>{new Date(invoice.created_at || invoice.invoice_date).toLocaleDateString()}</span>
              <span>•</span>
              <span style={{ color: '#a7f3d0', fontWeight: 800 }}>
                ₹{totalAmount.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.22)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
          <button
            type="button"
            onClick={() => setViewMode('ticket')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 9px',
              borderRadius: '7px',
              border: 'none',
              background: viewMode === 'ticket' ? '#ffffff' : 'transparent',
              color: viewMode === 'ticket' ? '#064e3b' : 'rgba(255, 255, 255, 0.88)',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: viewMode === 'ticket' ? '0 2px 6px rgba(0,0,0,0.18)' : 'none'
            }}
          >
            <Smartphone size={13} />
            <span>Pass</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('print')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 9px',
              borderRadius: '7px',
              border: 'none',
              background: viewMode === 'print' ? '#ffffff' : 'transparent',
              color: viewMode === 'print' ? '#064e3b' : 'rgba(255, 255, 255, 0.88)',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: viewMode === 'print' ? '0 2px 6px rgba(0,0,0,0.18)' : 'none'
            }}
          >
            <FileText size={13} />
            <span>A4 Bill</span>
          </button>
        </div>
      </header>

      {/* Instant Action Toolbar */}
      <div className="no-print" style={{ backgroundColor: 'var(--color-bg-card, #ffffff)', borderBottom: '1px solid var(--color-border, #c4e7d4)', padding: '10px 12px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Share2 size={15} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-border, #c4e7d4)',
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              color: 'var(--color-text-main, #0f172a)',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>PDF Print</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFormatSelection(true)}
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-primary, #059669)',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--color-primary, #059669)',
              fontWeight: 800,
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Palette size={15} />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-border, #c4e7d4)',
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              color: 'var(--color-text-main, #0f172a)',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {copiedLink ? <Check size={15} color="#059669" /> : <Copy size={15} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick Format Selector Bar */}
      <div className="no-print" style={{ backgroundColor: 'var(--color-bg-subtle, #dcf2e5)', borderBottom: '1px solid var(--color-border, #c4e7d4)', padding: '8px 12px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setShowFormatSelection(true)}
            style={{
              padding: '5px 11px',
              borderRadius: '16px',
              border: '1.5px solid var(--color-primary, #059669)',
              backgroundColor: 'var(--color-primary, #059669)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0
            }}
          >
            <Palette size={13} />
            <span>All Formats ▾</span>
          </button>

          {ALL_FORMAT_OPTIONS.map(tpl => {
            const isSelected = selectedFormat === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSwitchFormat(tpl.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: isSelected ? '1.5px solid #047857' : '1px solid var(--color-border, #c4e7d4)',
                  backgroundColor: isSelected ? 'var(--color-primary, #059669)' : 'var(--color-bg-card, #ffffff)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-main, #0f172a)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: isSelected ? '0 2px 10px rgba(5, 150, 105, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <span>{tpl.icon}</span>
                <span>{tpl.name}</span>
                {isSelected && <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.3)', padding: '1px 5px', borderRadius: '10px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="billing-inner-wrap" style={{ marginTop: '14px' }}>
        {/* VIEW MODE 1: LUXURY FINTECH DIGITAL PASS */}
        {viewMode === 'ticket' ? (
          <div className="digital-ticket-wrapper hide-on-print">
            <div className="digital-ticket">
              {/* Ticket Top Banner */}
              <div style={{
                padding: '22px 18px',
                background: 'linear-gradient(135deg, #064e3b 0%, #065f46 52%, #059669 100%)',
                color: '#ffffff',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div className="verified-stamp" style={{ background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', color: '#ffffff' }}>
                    <ShieldCheck size={13} />
                    <span>Verified Invoice</span>
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#ffffff',
                    border: '1px solid rgba(52, 211, 153, 0.5)'
                  }}>
                    ORIGINAL BILL
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {mergedCompany?.logo && (
                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                      }}>
                        <img 
                          src={mergedCompany.logo} 
                          alt="Merchant Logo" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                    </div>
                  )}
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {mergedCompany?.company_name || 'GoBill Store'}
                  </h2>
                  {mergedCompany?.owner_name && (
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '2px' }}>
                      Prop: {mergedCompany.owner_name}
                    </div>
                  )}
                  {mergedCompany?.address && (
                    <p style={{ fontSize: '0.78rem', opacity: 0.8, margin: '0 0 4px', lineHeight: 1.3 }}>
                      {[mergedCompany.address, mergedCompany.address_line_2, mergedCompany.city, mergedCompany.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {mergedCompany?.phone && (
                    <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginBottom: '2px' }}>
                      Ph: {mergedCompany.phone}
                    </div>
                  )}
                  {mergedCompany?.gst_number && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      GSTIN: {mergedCompany.gst_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Perforated Divider with Punch Holes */}
              <div className="ticket-perforation">
                <div className="ticket-punch-left" />
                <div className="ticket-dashed-line" />
                <div className="ticket-punch-right" />
              </div>

              {/* Ticket Body Content */}
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-bg-card, #ffffff)' }}>
                {/* Meta details grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingBottom: '14px',
                  borderBottom: '1px dashed var(--color-border, #e2e8f0)',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted, #64748b)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Invoice Number
                    </span>
                    <strong style={{ color: 'var(--color-text-main, #0f172a)', fontSize: '0.9rem' }}>{invoice.invoice_number}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-text-muted, #64748b)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Date & Time
                    </span>
                    <strong style={{ color: 'var(--color-text-main, #0f172a)', fontSize: '0.9rem' }}>
                      {new Date(invoice.created_at || invoice.invoice_date).toLocaleDateString()}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted, #64748b)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Billed To
                    </span>
                    <strong style={{ color: 'var(--color-text-main, #0f172a)', fontSize: '0.9rem' }}>
                      {invoice.customer_name || 'Customer'}
                    </strong>
                    {(invoice.customer_mobile || invoice.customer_phone) && (
                      <div style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.75rem' }}>
                        {invoice.customer_mobile || invoice.customer_phone}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-text-muted, #64748b)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Payment Method
                    </span>
                    <strong style={{ color: 'var(--color-text-main, #0f172a)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      {invoice.payment_method || 'Cash'}
                    </strong>
                  </div>
                </div>

                {/* Items Purchased */}
                <div style={{ padding: '14px 0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted, #64748b)', fontWeight: 800, marginBottom: '10px' }}>
                    Purchased Items ({items.length})
                  </div>

                  {items.map((it, idx) => {
                    const q = Number(it.quantity) || 1;
                    const p = Number(it.unit_price || it.amount) || 0;
                    const total = q * p;

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border, #f8fafc)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-main, #0f172a)', fontSize: '0.875rem' }}>
                            {it.description || it.item_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                            {q} units × ₹{p.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-main, #0f172a)', fontSize: '0.95rem' }}>
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals Calculation */}
                <div style={{ borderTop: '1px dashed var(--color-border, #cbd5e1)', paddingTop: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--color-text-muted, #64748b)' }}>
                    <span>Subtotal</span>
                    <span style={{ color: 'var(--color-text-main, #0f172a)', fontWeight: 600 }}>₹{Number(invoice.amount || invoice.subtotal || totalAmount).toFixed(2)}</span>
                  </div>

                  {Number(invoice.discount_amount || invoice.discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--color-success, #059669)', fontWeight: 600 }}>
                      <span>Discount</span>
                      <span>- ₹{Number(invoice.discount_amount || invoice.discount).toFixed(2)}</span>
                    </div>
                  )}

                  {invoice.gst_enabled && Number(invoice.tax_amount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--color-text-muted, #64748b)' }}>
                      <span>GST ({invoice.gst_rate}%)</span>
                      <span style={{ color: 'var(--color-text-main, #0f172a)', fontWeight: 600 }}>+ ₹{Number(invoice.tax_amount).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0 6px',
                    borderTop: '2px solid var(--color-border, #0f172a)',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-text-main, #0f172a)' }}>Grand Total</span>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-primary, #059669)', letterSpacing: '-0.02em' }}>
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* UPI QR Pay Box */}
                {!isPaid && (
                  <div className="upi-qr-card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <QrCode size={16} color="var(--color-primary, #059669)" />
                      <span>Scan & Pay via any UPI App</span>
                    </div>
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="upi-qr-img"
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)' }}>
                      GPay • PhonePe • Paytm • BHIM
                    </div>
                  </div>
                )}

                {/* Barcode Strip */}
                <div className="barcode-strip" />

                {invoice.notes && (
                  <div style={{ marginTop: '14px', padding: '10px', background: 'var(--color-bg-subtle, #f8fafc)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', textAlign: 'center' }}>
                    {invoice.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: A4 PRINT DOCUMENT */
          <div className="invoice-overflow-wrapper">
            {/* Phone Screen Helper Guide Pill */}
            <div className="no-print mobile-a4-guide-pill" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-bg-card, #ffffff)',
              border: '1px solid var(--color-border, #c4e7d4)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '10px',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #475569)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>📄</span>
                <span><strong>{ALL_FORMAT_OPTIONS.find(t => t.id === selectedFormat)?.name || 'A4 Format'}</strong> • Full A4 Paper</span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={12} />
                <span>PDF Print</span>
              </button>
            </div>

            <div className="invoice-print-container">
              {(selectedFormat === 'standard' || selectedFormat === 'normal') && (
                <BasicInvoice invoice={displayInvoice} formatCurrency={InvoiceService.formatCurrency} formatDate={InvoiceService.formatDate} />
              )}
              {selectedFormat === 'tally' && <TallyInvoice invoice={displayInvoice} />}
              {selectedFormat === 'classic' && <ClassicInvoice invoice={displayInvoice} />}
              {selectedFormat === 'modern' && <ModernInvoice invoice={displayInvoice} />}
              {selectedFormat === 'wholesale' && <WholesaleInvoice invoice={displayInvoice} />}
              {selectedFormat === 'retail' && <RetailInvoice invoice={displayInvoice} />}
              {selectedFormat === 'advanced' && <AdvancedInvoice invoice={displayInvoice} />}
              {selectedFormat === 'service' && <ServiceInvoice invoice={displayInvoice} />}
              {selectedFormat === 'proforma' && <ProformaInvoice invoice={displayInvoice} />}
              {selectedFormat === 'premium' && <PremiumInvoice invoice={displayInvoice} />}
              {!['standard', 'normal', 'tally', 'classic', 'modern', 'wholesale', 'retail', 'advanced', 'service', 'proforma', 'premium'].includes(selectedFormat) && (
                <TallyInvoice invoice={displayInvoice} />
              )}

              {/* Official GoBill Print Watermark Footer */}
              <div className="gobill-pdf-footer" style={{
                textAlign: 'center',
                fontSize: '10px',
                color: '#64748b',
                padding: '8px 12px',
                marginTop: '12px',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <span>Generated via <strong style={{ color: '#059669' }}>GoBill</strong></span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span>Smart Invoicing & GST Billing</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>https://gobill.gldatacenter.com</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky-billing-footer no-print">
        <div className="sticky-billing-content">
          <div className="sticky-total-info">
            <span className="sticky-total-label">Invoice Total</span>
            <span className="sticky-total-amount">₹{totalAmount.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button 
              type="button" 
              className="sticky-action-btn"
              style={{ 
                background: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--color-primary, #059669)',
                border: '1.5px solid var(--color-primary, #059669)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                padding: '10px 12px',
                fontSize: '0.825rem',
                minWidth: 'auto',
                flex: 'none'
              }}
              onClick={() => setShowFormatSelection(true)}
              title="Change Invoice Format"
            >
              <Palette size={16} />
              <span>Format</span>
            </button>

            <button 
              type="button" 
              className="sticky-action-btn"
              style={{ 
                background: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-main, #0f172a)',
                border: '1.5px solid var(--color-border, #c4e7d4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '10px 12px',
                fontSize: '0.825rem'
              }}
              onClick={handlePrint}
            >
              <Printer size={16} color="var(--color-primary, #059669)" />
              <span>Print</span>
            </button>

            <button 
              type="button" 
              className="sticky-action-btn"
              style={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                padding: '10px 14px',
                fontSize: '0.825rem'
              }}
              onClick={handleShareWhatsApp}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT RECORDING MODAL */}
      {showPaymentModal && (
        <div className="summary-sheet-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="summary-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="summary-sheet-handle" />
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main, #0f172a)' }}>
              Record Customer Payment
            </h3>
            
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main, #475569)', marginBottom: '4px' }}>
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    backgroundColor: 'var(--color-bg-card, #ffffff)',
                    color: 'var(--color-text-main, #0f172a)',
                    fontSize: '0.95rem', outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', display: 'block', marginTop: '3px' }}>
                  Outstanding balance: ₹{balanceDue.toFixed(2)}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main, #475569)', marginBottom: '4px' }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.9rem',
                    backgroundColor: 'var(--color-bg-card, #ffffff)',
                    color: 'var(--color-text-main, #0f172a)', outline: 'none'
                  }}
                >
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="cash">Cash</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Net Banking / NEFT</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main, #475569)', marginBottom: '4px' }}>
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cash memo"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    backgroundColor: 'var(--color-bg-card, #ffffff)',
                    color: 'var(--color-text-main, #0f172a)',
                    fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" loading={recordingPayment} style={{ flex: 1, backgroundColor: 'var(--color-primary, #059669)', borderColor: 'var(--color-primary, #059669)' }}>
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE FORMAT SELECTION MODAL */}
      {showFormatSelection && (
        <div className="summary-sheet-overlay" onClick={() => setShowFormatSelection(false)}>
          <div className="summary-sheet-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="summary-sheet-handle" />
            
            {/* Bill Generated Success Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(5,150,105,0.12) 0%, rgba(16,185,129,0.06) 100%)',
              border: '1px solid rgba(16,185,129,0.3)',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '24px' }}>🎉</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary, #059669)' }}>
                  Bill #{invoice?.invoice_number || 'INV'} Generated!
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Total: ₹{totalAmount.toFixed(2)} • {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main, #0f172a)' }}>
                  Choose Invoice Format / Type
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Tap any format below to instantly generate and view your bill:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormatSelection(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted, #64748b)', cursor: 'pointer', fontSize: '1.3rem', padding: '2px 6px' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '2px' }}>
              {ALL_FORMAT_OPTIONS.map(f => {
                const isSelected = selectedFormat === f.id;
                return (
                  <div 
                    key={f.id}
                    onClick={() => handleSwitchFormat(f.id)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.12)' : 'var(--color-bg-card, #ffffff)',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? 'var(--color-primary, #059669)' : 'var(--color-border, #e2e8f0)'}`,
                      padding: '12px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.2)' : 'none',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                      {f.icon}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 800, color: isSelected ? 'var(--color-primary, #059669)' : 'var(--color-text-main, #1e293b)' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #64748b)', marginTop: '2px', lineHeight: 1.25 }}>
                      {f.desc}
                    </div>
                    {isSelected ? (
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.7rem', 
                        color: 'var(--color-primary, #059669)', 
                        fontWeight: 800, 
                        marginTop: '6px',
                        background: 'rgba(5, 150, 105, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        ✓ Active
                      </div>
                    ) : (
                      <div style={{ 
                        fontSize: '0.68rem', 
                        color: 'var(--color-primary, #059669)', 
                        fontWeight: 700, 
                        marginTop: '6px',
                        opacity: 0.8
                      }}>
                        Select &rarr;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <Button fullWidth variant="secondary" onClick={() => setShowFormatSelection(false)}>
                {selectedFormat ? `Keep Current (${ALL_FORMAT_OPTIONS.find(t => t.id === selectedFormat)?.name || selectedFormat})` : 'Done'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
