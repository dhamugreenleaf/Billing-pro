import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import useSEO from '../utils/useSEO';
import './AuthLayout.css';

const AuthLayout = () => {
  useSEO({
    title: 'Login | GoBill',
    description: 'Login to your GoBill account to manage your invoices, bills, and customers.',
    noindex: true
  });

  return (
    <div className="auth-layout-wrapper">
      {/* Top Header */}
      <header className="auth-header">
        <Link to="/" className="auth-brand-badge">
          <div className="auth-brand-icon">
            <Receipt size={22} />
          </div>
          <span className="auth-brand-name">GoBill</span>
        </Link>
      </header>

      {/* Center Auth Card Body */}
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome Back</h1>
            <p className="auth-card-subtitle">Sign in to manage your bills and invoices</p>
          </div>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <p className="auth-footer-text">
          &copy; {new Date().getFullYear()} GoBill Technologies. Secure GST POS Platform.
        </p>
        <div className="auth-footer-links">
          <Link to="/gst-billing-software">GST Features</Link>
          <Link to="/invoice-formats">Invoice Formats</Link>
          <Link to="/retail-billing-software">Retail Billing</Link>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
