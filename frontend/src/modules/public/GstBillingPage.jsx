import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../../utils/useSEO';
import Button from '../../components/Button';
import { ShieldCheck, Percent, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

const GstBillingPage = () => {
  useSEO({
    title: 'GST Billing Software | Tax Compliant Invoicing by GoBill',
    description: 'Easily configure your business taxes and generate GST compliant invoices with GoBill. Simple online GST billing software for Indian businesses.',
    noindex: false
  });

  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GoBill GST Billing",
    "applicationCategory": "BusinessApplication",
    "description": "GST billing software feature for generating tax compliant invoices in India."
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Hero Section */}
      <header className="hero-section" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <h1>GST Billing Software Made Simple</h1>
        <p>
          Generate tax-compliant invoices effortlessly. Configure your GST settings once and let GoBill handle the rest for all your business transactions.
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/login')}>Start Billing <ChevronRight size={18} /></Button>
        </div>
      </header>

      {/* Main Features */}
      <section className="features-section">
        <h2 className="section-title">Actual GST Functionality</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Percent size={40} className="feature-icon" />
            <h3>Flexible GST Settings</h3>
            <p className="text-muted">Configure default tax percentages for your products and services directly in your admin settings.</p>
          </div>
          <div className="feature-card">
            <FileText size={40} className="feature-icon" />
            <h3>Tax-Ready Invoices</h3>
            <p className="text-muted">All our invoice formats support clear itemized GST breakdowns for your customers.</p>
          </div>
          <div className="feature-card">
            <ShieldCheck size={40} className="feature-icon" />
            <h3>Business Compliance</h3>
            <p className="text-muted">Keep accurate records of all billed taxes to help your accountant file returns smoothly.</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: 'var(--spacing-2xl) var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Why Use GoBill for GST Invoicing?</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>
          Whether you are a retailer, wholesaler, or service provider in India, managing taxes on every invoice can be time-consuming. Our GST billing software features are designed to be straightforward and functional without overwhelming you with complex accounting jargon.
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Add your GSTIN to your business profile easily.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Apply accurate tax rates to individual items on the bill.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Print clean, professional PDFs with distinct tax columns.
          </li>
        </ul>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>Ready to simplify your tax billing?</h2>
        <p>Create your account and start generating GST invoices today.</p>
        <Button onClick={() => navigate('/login')} variant="secondary" style={{ color: 'var(--color-primary)' }}>Login to GoBill</Button>
      </section>
    </>
  );
};

export default GstBillingPage;
