import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../../utils/useSEO';
import Button from '../../components/Button';
import { Store, Users, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

const RetailBillingPage = () => {
  useSEO({
    title: 'Retail Billing Software | Quick Receipts by GoBill',
    description: 'Fast and reliable retail billing software. Generate retail invoices, manage shop customers, and simplify your daily billing operations with GoBill.',
    noindex: false
  });

  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GoBill Retail Billing",
    "applicationCategory": "BusinessApplication",
    "description": "Retail billing software for generating fast receipts and managing customers."
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Hero Section */}
      <header className="hero-section" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <h1>Retail Billing Software for Fast Checkouts</h1>
        <p>
          Keep your queue moving. Use our specialized Retail Invoice format to generate quick, accurate receipts and easily manage your regular shop customers.
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/login')}>Get Started <ChevronRight size={18} /></Button>
        </div>
      </header>

      {/* Main Features */}
      <section className="features-section">
        <h2 className="section-title">Designed for Retail Shops</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Store size={40} className="feature-icon" />
            <h3>Dedicated Retail Format</h3>
            <p className="text-muted">A specialized invoice layout optimized for retail businesses that need clear, customer-friendly receipts.</p>
          </div>
          <div className="feature-card">
            <Users size={40} className="feature-icon" />
            <h3>Customer Management</h3>
            <p className="text-muted">Save customer details to generate future bills instantly without asking for information twice.</p>
          </div>
          <div className="feature-card">
            <FileText size={40} className="feature-icon" />
            <h3>Daily Bill Tracking</h3>
            <p className="text-muted">Access a complete history of all your daily retail bills to track your shop's performance easily.</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: 'var(--spacing-2xl) var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Streamline Your Shop's Billing</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>
          Retail billing requires speed and simplicity. Traditional accounting software is often too slow and complex for a busy shop counter. With GoBill's cloud-based interface and specific Retail invoice format, you can generate bills in seconds.
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Cloud-based access allows you to bill from anywhere.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Professional PDFs you can print or share directly with customers.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 color="var(--color-primary)" size={20} style={{ marginRight: '12px' }} />
            Built-in GST support so your retail shop remains tax compliant.
          </li>
        </ul>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>Ready to speed up your billing?</h2>
        <p>Login to your account and select the Retail template today.</p>
        <Button onClick={() => navigate('/login')} variant="secondary" style={{ color: 'var(--color-primary)' }}>Login to GoBill</Button>
      </section>
    </>
  );
};

export default RetailBillingPage;
