import React, { useState, useEffect } from 'react';
import { LayoutTemplate, CheckCircle2, XCircle, FileText, Eye, Download, X, Filter } from 'lucide-react';
import api from '../../../utils/api';

import AdvancedBillPdf from '../../../template/Advanced_Bill.pdf?url';
import ClassicalBillPdf from '../../../template/Classical_Bill.pdf?url';
import ModernGSTInvoicePdf from '../../../template/Modern_GST_Invoice.pdf?url';
import ProformaInvoicePdf from '../../../template/Proforma_Invoice.pdf?url';
import RetailPOSBillPdf from '../../../template/Retail_POS_Bill.pdf?url';
import ServiceInvoicePdf from '../../../template/Service_Invoice.pdf?url';
import WholesaleB2BInvoicePdf from '../../../template/Wholesale_B2B_Invoice.pdf?url';
import BasicFormatPdf from '../../../template/basic_format.pdf?url';
import TallyFormatPdf from '../../../template/tally_format.pdf?url';

const INITIAL_TEMPLATES = [
  { id: 'standard', name: 'Basic Format', type: 'pdf', file: BasicFormatPdf, description: 'A standard basic billing format for general purpose.', category: 'General' },
  { id: 'tally', name: 'Tally Format', type: 'pdf', file: TallyFormatPdf, description: 'Tally compatible invoice format.', category: 'Accounting' },
  { id: 'advanced', name: 'Advanced Bill', type: 'pdf', file: AdvancedBillPdf, description: 'Advanced billing format with detailed columns.', category: 'Detailed' },
  { id: 'classical', name: 'Classical Bill', type: 'pdf', file: ClassicalBillPdf, description: 'A classic and professional invoice design.', category: 'Classic' },
  { id: 'modern_gst', name: 'Modern GST Invoice', type: 'pdf', file: ModernGSTInvoicePdf, description: 'Modern invoice format compliant with GST rules.', category: 'Tax' },
  { id: 'proforma', name: 'Proforma Invoice', type: 'pdf', file: ProformaInvoicePdf, description: 'Standard proforma invoice for preliminary billing.', category: 'Proforma' },
  { id: 'retail_pos', name: 'Retail POS Bill', type: 'pdf', file: RetailPOSBillPdf, description: 'Compact bill format suitable for POS printers.', category: 'Retail' },
  { id: 'service', name: 'Service Invoice', type: 'pdf', file: ServiceInvoicePdf, description: 'Optimized for service-based businesses.', category: 'Service' },
  { id: 'wholesale_b2b', name: 'Wholesale B2B Invoice', type: 'pdf', file: WholesaleB2BInvoicePdf, description: 'Comprehensive B2B invoice format for bulk orders.', category: 'B2B' },
];

const AdminInvoiceFormats = () => {
  const [formatsState, setFormatsState] = useState(
    INITIAL_TEMPLATES.map(t => ({ ...t, status: 'active', backendId: null }))
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const fetchFormats = async () => {
    try {
      const response = await api.get('/subscription/admin/invoice-formats');
      if (response.data && response.data.data) {
        const backendData = response.data.data;
        setFormatsState(prev => prev.map(template => {
          const backendFormat = backendData.find(b => 
            b.template_identifier === template.id || 
            b.name.toLowerCase() === template.name.toLowerCase()
          );
          
          if (backendFormat) {
            return { ...template, status: backendFormat.status, backendId: backendFormat.id };
          }
          return template;
        }));
      }
    } catch (err) {
      console.error('Failed to load invoice formats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormats();
  }, []);

  const toggleFormatStatus = async (id) => {
    const template = formatsState.find(t => t.id === id);
    const newStatus = template.status === 'active' ? 'inactive' : 'active';
    
    // Optimistic update
    setFormatsState(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    if (template.backendId) {
      try {
        await api.patch(`/subscription/admin/invoice-formats/${template.backendId}/status`, { status: newStatus });
      } catch (err) {
        // Revert on failure
        alert('Failed to update format status');
        setFormatsState(prev => prev.map(t => t.id === id ? { ...t, status: template.status } : t));
      }
    }
  };

  const filteredFormats = formatsState.filter(format => {
    if (filter === 'All') return true;
    if (filter === 'Enabled') return format.status === 'active';
    if (filter === 'Disabled') return format.status !== 'active';
    return true;
  });

  const enabledCount = formatsState.filter(t => t.status === 'active').length;
  const disabledCount = formatsState.filter(t => t.status !== 'active').length;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading formats...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', paddingBottom: '3rem' }}>
      <style>{`
        .cards-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .template-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .template-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        .template-preview-container {
          position: relative;
          width: 100%;
          padding-top: 141.4%; /* A4 aspect ratio */
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .template-info {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .category-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .btn-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex: 1;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid transparent;
          padding: 0.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-preview:hover {
          background: #dbeafe;
        }
        .btn-download {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid transparent;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-download:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
        }
        .toggle-btn.active {
          border-color: #fecaca;
          color: #dc2626;
          background: #fef2f2;
        }
        .toggle-btn:not(.active):hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #16a34a;
        }
        .toggle-btn.active:hover {
          background: #fee2e2;
        }
        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          background: #f8fafc;
        }
        .filter-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .modal-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
        }
        .modal-body {
          flex: 1;
          overflow: hidden;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      `}</style>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.025em' }}>Invoice Formats</h1>
        <p className="text-muted" style={{ margin: '0.375rem 0 0 0', fontSize: '0.95rem' }}>Manage which templates are available to customers based on their plans.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{formatsState.length}</span>
          <span style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', fontWeight: '500' }}>Total Templates</span>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#16a34a', lineHeight: 1 }}>{enabledCount}</span>
          <span style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '0.5rem', fontWeight: '500' }}>Enabled</span>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#dc2626', lineHeight: 1 }}>{disabledCount}</span>
          <span style={{ fontSize: '0.875rem', color: '#b91c1c', marginTop: '0.5rem', fontWeight: '500' }}>Disabled</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setFilter('All')} className={`filter-btn ${filter === 'All' ? 'active' : ''}`}>All</button>
          <button onClick={() => setFilter('Enabled')} className={`filter-btn ${filter === 'Enabled' ? 'active' : ''}`}>Enabled</button>
          <button onClick={() => setFilter('Disabled')} className={`filter-btn ${filter === 'Disabled' ? 'active' : ''}`}>Disabled</button>
        </div>
      </div>

      <div className="cards-grid">
        {filteredFormats.map(format => (
          <div key={format.id} className="template-card">
            {/* Preview Area */}
            <div className="template-preview-container">
              {format.type === 'pdf' ? (
                <>
                  <iframe 
                    src={`${format.file}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    title={`${format.name} Preview`}
                  />
                  {/* Overlay to prevent interaction and trap clicks inside card */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'default' }} />
                </>
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                  <FileText size={48} color="#94a3b8" />
                  <span style={{ marginTop: '12px', fontWeight: '600', color: '#64748b' }}>ODT Template</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Preview unavailable</span>
                </div>
              )}
              {format.status !== 'active' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '0.875rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    Disabled
                  </span>
                </div>
              )}
            </div>

            {/* Info Area */}
            <div className="template-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: '600' }}>{format.name}</h3>
                <span className="category-badge">{format.category}</span>
              </div>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#64748b', minHeight: '2.5rem', lineHeight: 1.5 }}>
                {format.description}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button className="btn-preview" onClick={() => setPreviewTemplate(format)}>
                  <Eye size={16} /> Preview
                </button>
                {format.type === 'pdf' && (
                  <a href={format.file} download={format.name} className="btn-download" title="Download Template">
                    <Download size={16} />
                  </a>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
                    Status: <span style={{ color: format.status === 'active' ? '#16a34a' : '#dc2626', marginLeft: '0.25rem' }}>{format.status === 'active' ? 'Enabled' : 'Disabled'}</span>
                  </span>
                  <button 
                    className={`toggle-btn ${format.status === 'active' ? 'active' : ''}`}
                    onClick={() => toggleFormatStatus(format.id)}
                  >
                    {format.status === 'active' ? <><XCircle size={16} /> Disable</> : <><CheckCircle2 size={16} /> Enable</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '600' }}>{previewTemplate.name}</h2>
                <span className="category-badge">{previewTemplate.category}</span>
              </div>
              <button className="modal-close" onClick={() => setPreviewTemplate(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {previewTemplate.type === 'pdf' ? (
                <iframe 
                  src={`${previewTemplate.file}#toolbar=0`} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={`${previewTemplate.name} Preview`}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                  <FileText size={64} style={{ marginBottom: '1rem', color: '#94a3b8' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{previewTemplate.name}</h3>
                  <p style={{ margin: 0, textAlign: 'center' }}>ODT Templates cannot be previewed in the browser directly.</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Please download or convert the template to view it.</p>
                  <a 
                    href={previewTemplate.file} 
                    download={previewTemplate.name}
                    style={{ 
                      marginTop: '1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    <Download size={18} /> Download Template
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoiceFormats;

