import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import Button from '../components/Button';
import '../modules/public/PublicLandingPage.css';

const PublicLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="public-landing-page">
      {/* Navbar */}
      <nav className="public-navbar">
        <Link to="/" className="public-logo">GoBill</Link>
        <div className="public-nav-links d-none d-md-flex">
          <Link to="/">Home</Link>
          <Link to="/invoice-formats">Formats</Link>
          <Link to="/gst-billing-software">GST Features</Link>
          <Link to="/retail-billing-software">Retail</Link>
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate('/login')} className="mr-2">Login</Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>GoBill</h3>
        <p>Simple Billing Software & Invoicing Solution</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Home</Link>
          <Link to="/invoice-formats" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Invoice Formats</Link>
          <Link to="/gst-billing-software" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>GST Billing</Link>
          <Link to="/retail-billing-software" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Retail Billing</Link>
        </div>
        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '2rem' }}>&copy; {new Date().getFullYear()} GoBill. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;
