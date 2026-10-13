import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { Receipt, LogIn, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import '../modules/public/PublicLandingPage.css';

const PublicLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="public-landing-page">
      {/* Navbar */}
      <nav className="public-navbar">
        <Link to="/" className="public-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
          }}>
            <Receipt size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
            GoBill
          </span>
        </Link>

        <div className="public-nav-links d-none d-md-flex">
          <Link to="/">Home</Link>
          <Link to="/invoice-formats">Invoice Formats</Link>
          <Link to="/gst-billing-software">GST Features</Link>
          <Link to="/retail-billing-software">Retail Billing</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/login')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <LogIn size={15} />
            <span>Login</span>
          </Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Receipt size={24} color="#3b82f6" />
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>GoBill</h3>
          </div>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Next-generation GST billing &amp; point-of-sale invoicing platform built for speed and precision.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Link to="/" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Home</Link>
            <Link to="/invoice-formats" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Invoice Formats</Link>
            <Link to="/gst-billing-software" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>GST Billing</Link>
            <Link to="/retail-billing-software" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Retail Billing</Link>
            <Link to="/login" style={{ color: '#60a5fa', fontSize: '0.875rem', fontWeight: 600 }}>Login</Link>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            &copy; {new Date().getFullYear()} GoBill. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
