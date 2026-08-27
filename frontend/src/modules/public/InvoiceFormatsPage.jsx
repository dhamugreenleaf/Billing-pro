import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../../utils/useSEO';
import Button from '../../components/Button';
import { Layout, CheckCircle2, ChevronRight } from 'lucide-react';

const InvoiceFormatsPage = () => {
  useSEO({
    title: '9 Invoice Formats including Tally Format | GoBill',
    description: 'Explore 9 professional invoice formats for your business. From Retail and Wholesale to a specialized Tally format invoice, GoBill has you covered.',
    noindex: false
  });

  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GoBill Invoice Formats",
    "applicationCategory": "BusinessApplication",
    "description": "Invoice software with 9 distinct layout templates including Tally-format."
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Hero Section */}
      <header className="hero-section" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <h1>Professional Invoice Formats</h1>
        <p>
          Your invoice represents your business. Choose from 9 distinct invoice formats designed specifically for Indian retail, wholesale, and service businesses.
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/login')}>Try All Formats <ChevronRight size={18} /></Button>
        </div>
      </header>

      {/* Formats Grid Section */}
      <section className="features-section">
        <h2 className="section-title">Explore Our 9 Templates</h2>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Basic Invoice</h3>
            <p className="text-muted">A clean, straightforward format for everyday billing and simple transactions.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Advance Invoice</h3>
            <p className="text-muted">Detailed format designed for complex billing and advanced commercial requirements.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Retail Invoice</h3>
            <p className="text-muted">Optimized for retail businesses needing quick, customer-friendly receipts.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Wholesale Invoice</h3>
            <p className="text-muted">Structured for B2B wholesale transactions with bulk quantities and trade discounts.</p>
          </div>
          <div className="feature-card" style={{ borderColor: 'var(--color-primary)' }}>
            <Layout size={32} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--color-primary)' }}>Tally Format Invoice</h3>
            <p className="text-muted">A specialized Tally-format invoice template that matches the familiar Tally accounting software layout. Perfect for sending bills to your accountant.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Service Invoice</h3>
            <p className="text-muted">Ideal for service providers and freelancers billing for time, labor, or consulting.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Classic Invoice</h3>
            <p className="text-muted">A timeless, traditional invoice layout that conveys professional reliability.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Modern Invoice</h3>
            <p className="text-muted">A sleek, contemporary design to give your business invoices a premium look.</p>
          </div>
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Proforma Invoice</h3>
            <p className="text-muted">Preliminary bill of sale sent to buyers in advance of a shipment or delivery of goods.</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: 'var(--spacing-2xl) var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Tally Format Invoice Support</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>
          Many Indian businesses and Chartered Accountants prefer the standard layout provided by Tally. GoBill provides a specific <strong>Tally-format invoice</strong> template. This allows you to enjoy the benefits of a modern cloud billing software while generating PDFs that look exactly like the familiar accounting layout your partners expect.
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Switch between formats instantly without re-typing data.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            All formats support automatic GST calculations.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Download high-quality PDFs ready for printing or sharing.
          </li>
        </ul>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>Ready to upgrade your invoices?</h2>
        <p>Login to your account to select your preferred format.</p>
        <Button onClick={() => navigate('/login')} variant="secondary" style={{ color: 'var(--color-primary)' }}>Login to GoBill</Button>
      </section>
    </>
  );
};

export default InvoiceFormatsPage;
