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
import { ArrowLeft, Printer, Download, Share2, Phone, Edit, MessageCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewlyGenerated = searchParams.get('generated') === 'true';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState([]);
  
  // States for format selection
  const [showFormatSelection, setShowFormatSelection] = useState(isNewlyGenerated);
  const [selectedFormat, setSelectedFormat] = useState('normal'); 
  const [savingFormat, setSavingFormat] = useState(false);

  const isAutoPrint = searchParams.get('print') === 'true';

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const [res, formatsRes] = await Promise.all([
          InvoiceService.getInvoiceById(id),
          api.get('/subscription/invoice-formats')
        ]);
        if (res.data) {
          setInvoice(res.data);
          setSelectedFormat(res.data.invoice_template || 'normal');
        }
        if (formatsRes.data) {
          setFormats(formatsRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (invoice && isAutoPrint && !showFormatSelection) {
      // Small timeout to allow styles/fonts to apply before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, isAutoPrint, showFormatSelection]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmFormat = async () => {
    setSavingFormat(true);
    try {
      await InvoiceService.updateInvoiceTemplate(id, selectedFormat);
      setInvoice(prev => ({ ...prev, invoice_template: selectedFormat }));
      setShowFormatSelection(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFormat(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (invoice.customer_phone) {
      const text = `Hi ${invoice.customer_name},\nHere is your invoice ${invoice.invoice_number} for ₹${invoice.total.toFixed(2)}.`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${invoice.customer_phone}?text=${encodedText}`, '_blank');
      toast.success('Sharing via WhatsApp...');
    } else {
      toast.error('Customer phone number not available');
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading Preview...</div>;
  if (!invoice) return <div className="text-center mt-4 text-error">Invoice not found.</div>;

  // FORMAT SELECTION SCREEN
  if (showFormatSelection) {
    return (
      <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: 'var(--spacing-xl) var(--spacing-md)' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
            <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-sm)' }} />
            <h2 style={{ margin: '0 0 var(--spacing-xs)' }}>Bill Generated Successfully</h2>
            <p className="text-muted" style={{ margin: '0 0 var(--spacing-sm)' }}>Invoice No: {invoice.invoice_number}</p>
            <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Total: ₹{invoice.total_amount}</h3>
          </div>

          <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Choose Bill Format</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
            {formats.map(f => (
              <div 
                key={f.id}
                onClick={() => {
                  setSelectedFormat(f.template_identifier);
                }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${selectedFormat === f.template_identifier ? 'var(--color-primary)' : 'transparent'}`,
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  padding: 'var(--spacing-md)',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'transform 0.2s, border-color 0.2s',
                  transform: selectedFormat === f.template_identifier ? 'scale(1.05)' : 'scale(1)',
                  opacity: f.available ? 1 : 0.8
                }}
              >
                {!f.available && (
                  <span style={{ 
                    position: 'absolute', top: '-8px', right: '-8px', 
                    backgroundColor: 'var(--color-warning)', color: 'white', 
                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                  }}>
                    {f.required_plan}
                  </span>
                )}
                <div style={{
                  width: '100%', height: '80px', backgroundColor: '#e5e7eb',
                  borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af'
                }}>
                  {f.available ? 'Preview' : '🔒 Locked'}
                </div>
                <h4 style={{ margin: 0, color: selectedFormat === f.template_identifier ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                  {f.name}
                </h4>
                {selectedFormat === f.template_identifier && (
                  <div style={{ color: 'var(--color-primary)', fontSize: '12px', marginTop: '4px' }}>✓ Selected</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
            <Button onClick={handleConfirmFormat} loading={savingFormat} style={{ padding: '12px 32px', fontSize: '16px' }}>
              Continue to Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW SCREEN
  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: 'calc(var(--spacing-2xl) + 80px)' }}>
      <style>{`
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .preview-title-group {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .preview-header-title {
          font-size: 24px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preview-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .preview-actions button {
          display: flex;
          justify-content: center;
        }
        .invoice-overflow-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0 var(--spacing-sm) var(--spacing-sm) var(--spacing-sm);
        }
        .invoice-print-container {
          min-width: 800px;
          max-width: 850px;
          margin: 0 auto;
          box-shadow: var(--shadow-lg);
          background-color: #fff;
          position: relative;
        }
        
        @media (min-width: 769px) {
          .preview-title-group {
            width: auto;
          }
        }
        
        @media (max-width: 768px) {
          .preview-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .preview-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            gap: 8px;
          }
          .preview-actions > * {
            width: 100%;
          }
          .preview-actions > *:last-child {
            grid-column: span 2;
          }
        }
        
        @media (max-width: 480px) {
          .preview-header-title {
            font-size: 20px;
          }
          .preview-actions {
            grid-template-columns: 1fr;
          }
          .preview-actions > *:last-child {
            grid-column: span 1;
          }
        }
      `}</style>

      {/* Top Header Controls (Hidden during print) */}
      <div className="no-print" style={{ 
        backgroundColor: 'var(--color-bg-card)', 
        padding: 'var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="container preview-header">
          <div className="preview-title-group">
            <button 
              onClick={() => navigate('/bills')} 
              style={{ background: 'none', border: 'none', marginRight: 'var(--spacing-sm)', cursor: 'pointer', flexShrink: 0 }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="preview-header-title">Invoice Preview</h2>
          </div>
          <div className="preview-actions">
            <Button variant="secondary" onClick={() => setShowFormatSelection(true)} style={{ width: '100%' }}>
              Change Format
            </Button>
            <Button onClick={handleShareWhatsApp} style={{ backgroundColor: '#25D366', width: '100%' }}>
              <Share2 size={18} style={{ marginRight: '8px' }} />
              WhatsApp
            </Button>
            <Button onClick={handlePrint} style={{ width: '100%' }}>
              <Download size={18} style={{ marginRight: '8px' }} />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Render Area */}
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="invoice-overflow-wrapper">
          <div className="invoice-print-container">
            
            {!formats.find(f => f.template_identifier === selectedFormat)?.available && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 5, textAlign: 'center', padding: 'var(--spacing-xl)'
              }}>
                <div style={{ backgroundColor: '#fff', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '400px' }}>
                  <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🔒</div>
                  <h3 style={{ margin: '0 0 var(--spacing-sm)' }}>Premium Format Locked</h3>
                  <p className="text-muted" style={{ margin: '0 0 var(--spacing-lg)' }}>
                    This format requires the <strong>{formats.find(f => f.template_identifier === selectedFormat)?.required_plan}</strong> plan.
                  </p>
                  <Button onClick={() => navigate('/admin/plans')} style={{ width: '100%' }}>
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Render the selected template */}
            {selectedFormat === 'standard' && <BasicInvoice invoice={invoice} formatCurrency={InvoiceService.formatCurrency} formatDate={InvoiceService.formatDate} />}
            {selectedFormat === 'tally' && <TallyInvoice invoice={invoice} />}
            {selectedFormat === 'classic' && <ClassicInvoice invoice={invoice} />}
            {selectedFormat === 'modern' && <ModernInvoice invoice={invoice} />}
            {selectedFormat === 'wholesale' && <WholesaleInvoice invoice={invoice} />}
            {selectedFormat === 'retail' && <RetailInvoice invoice={invoice} />}
            {selectedFormat === 'advanced' && <AdvancedInvoice invoice={invoice} />}
            {selectedFormat === 'service' && <ServiceInvoice invoice={invoice} />}
            {selectedFormat === 'proforma' && <ProformaInvoice invoice={invoice} />}
            {selectedFormat === 'premium' && <PremiumInvoice invoice={invoice} />}

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
