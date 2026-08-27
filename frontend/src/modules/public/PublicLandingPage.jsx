import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSEO from '../../utils/useSEO';
import Button from '../../components/Button';
import PublicLayout from '../../layouts/PublicLayout';
import { FileText, Users, Receipt, ShieldCheck, ChevronRight, BarChart, Layout } from 'lucide-react';
import './PublicLandingPage.css';

const PublicLandingPage = () => {
  useSEO({
    title: 'GoBill | Simple Billing Software & Invoicing Solution',
    description: 'Manage your business effortlessly with GoBill. Generate digital invoices, manage customers, and track bills with our professional billing software.',
    noindex: false
  });

  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GoBill",
    "applicationCategory": "BusinessApplication",
    "description": "Professional billing software and invoicing solution for small businesses.",
    "operatingSystem": "All"
  };

  return (
    <PublicLayout>
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Hero Section */}
      <header className="hero-section">
        <h1>Simple Billing Software for Your Business</h1>
        <p>
          Generate digital invoices, manage customers, and organize your bill records from anywhere. GoBill is the easy-to-use billing software designed to help businesses run smoothly.
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/login')}>Get Started <ChevronRight size={18} /></Button>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Powerful Billing Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FileText size={40} className="feature-icon" />
            <h3>Digital Invoice Generation</h3>
            <p className="text-muted">Create professional invoices in seconds using our built-in multi-format templates.</p>
          </div>
          <div className="feature-card">
            <Receipt size={40} className="feature-icon" />
            <h3>Bill History & Tracking</h3>
            <p className="text-muted">Keep a complete, organized record of all your past bills for easy reference.</p>
          </div>
          <div className="feature-card">
            <Users size={40} className="feature-icon" />
            <h3>Customer Management</h3>
            <p className="text-muted">Save customer details to generate future invoices faster and track interactions.</p>
          </div>
          <div className="feature-card">
            <BarChart size={40} className="feature-icon" />
            <h3>Reports & Analytics</h3>
            <p className="text-muted">Gain insights into your business performance with clear reporting tools.</p>
          </div>
          <div className="feature-card">
            <ShieldCheck size={40} className="feature-icon" />
            <h3>GST Support</h3>
            <p className="text-muted">Easily configure GST settings to stay compliant with your tax requirements.</p>
          </div>
        </div>
      </section>

      {/* Invoice Formats Section */}
      <section id="invoice-formats" className="features-section" style={{ backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="section-title">9 Invoice Formats</h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <p style={{ fontSize: '1.1rem' }}>
            Every business is unique. That's why our invoice software provides 9 distinct invoice formats to suit your specific billing requirements. Choose the template that perfectly represents your business invoices.
          </p>
        </div>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
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
          <div className="feature-card">
            <Layout size={32} className="feature-icon" />
            <h3>Tally Format</h3>
            <p className="text-muted">A specialized Tally-format invoice template that matches the familiar Tally accounting software layout.</p>
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

      {/* How it Works Section */}
      <section id="how-it-works" className="workflow-section" style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="section-title">How GoBill Works</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h3>Create Profile</h3>
            <p className="text-muted">Set up your business and customer information securely.</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h3>Generate Bill</h3>
            <p className="text-muted">Select a template, add your products or services, and generate the invoice.</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h3>Manage Everything</h3>
            <p className="text-muted">Track your billing history, analyze reports, and manage customers in one place.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2 className="section-title">Why Businesses Choose GoBill</h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            GoBill is ideal for small businesses, retail shops, freelancers, and service providers who need reliable invoice management without the complexity of traditional accounting software. 
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '1rem' }}>✓ Faster invoice creation</div>
            <div style={{ padding: '1rem' }}>✓ Organized bill records</div>
            <div style={{ padding: '1rem' }}>✓ Accessible digital billing</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>What is GoBill?</h3>
            <p className="text-muted">GoBill is a professional billing software designed to help businesses generate digital invoices, manage customers, and track billing history easily.</p>
          </div>
          <div className="faq-item">
            <h3>Who can use GoBill?</h3>
            <p className="text-muted">GoBill is perfect for small businesses, shops, freelancers, and service providers who need a straightforward invoicing solution.</p>
          </div>
          <div className="faq-item">
            <h3>Can I generate invoices with GoBill?</h3>
            <p className="text-muted">Yes, you can generate invoices using various customizable templates and download them instantly.</p>
          </div>
          <div className="faq-item">
            <h3>How many invoice formats does GoBill provide?</h3>
            <p className="text-muted">GoBill provides 9 customizable invoice formats including Basic, Advance, Retail, Wholesale, Tally Format, Service, Classic, Modern, and Proforma invoices to suit different business needs.</p>
          </div>
          <div className="faq-item">
            <h3>Does GoBill support Tally format invoices?</h3>
            <p className="text-muted">Yes, GoBill includes a specific Tally-format invoice template so your bills can match the familiar layout used in Tally software.</p>
          </div>
          <div className="faq-item">
            <h3>How do I access my GoBill account?</h3>
            <p className="text-muted">You can securely log in using your registered mobile number and OTP to access your private dashboard.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to simplify your billing?</h2>
        <p>Start organizing your business invoices today with GoBill.</p>
        <Button onClick={() => navigate('/login')} variant="secondary" style={{ color: 'var(--color-primary)' }}>Login to Your Account</Button>
      </section>
    </PublicLayout>
  );
};

export default PublicLandingPage;
