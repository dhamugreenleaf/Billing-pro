import React from 'react';
import { Outlet } from 'react-router-dom';
import useSEO from '../utils/useSEO';

const AuthLayout = () => {
  useSEO({
    title: 'Login | GoBill',
    description: 'Login to your GoBill billing software account to manage your invoices and customers.',
    noindex: true
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-main)',
      padding: 'var(--spacing-md)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '2rem' }}>Billing Pro</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0 0' }}>Manage your business effortlessly</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
