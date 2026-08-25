import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import Button from '../../components/Button';
import { Percent, Shield, FileText, ChevronRight } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();

  const settingCards = [
    {
      title: 'GST SETTINGS',
      description: 'Manage your default GST rate and choose the GST rate to apply to invoices.',
      icon: <Percent size={24} />, 
      path: '/settings/gst'
    },
    {
      title: 'TERMS & CONDITIONS',
      description: 'Read the terms and conditions for using Billing Pro.',
      icon: <FileText size={24} />, 
      path: '#'
    },
    {
      title: 'PRIVACY POLICY',
      description: 'Read our privacy policy to understand how we protect your data.',
      icon: <Shield size={24} />, 
      path: '#'
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: 'calc(var(--spacing-2xl) + 80px)' }}>
      <style>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--spacing-xl) var(--spacing-md);
        }
        .settings-header {
          margin-bottom: var(--spacing-2xl);
        }
        .settings-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 var(--spacing-xs) 0;
          letter-spacing: -0.025em;
        }
        .settings-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }
        .cards-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .settings-card-item {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .settings-card-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .setting-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          margin-right: 1.25rem;
          flex-shrink: 0;
          background: #eff6ff;
          color: #2563eb;
        }
        .setting-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .setting-label {
          font-weight: 600;
          color: #0f172a;
          font-size: 1.05rem;
          margin-bottom: 4px;
        }
        .setting-desc {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.4;
        }
        .setting-arrow {
          color: #cbd5e1;
          transition: transform 0.2s ease, color 0.2s ease;
          margin-left: 1rem;
        }
        .settings-card-item:hover .setting-arrow {
          transform: translateX(4px);
          color: #94a3b8;
        }
        
        .logout-btn-wrapper {
          display: flex;
          justify-content: flex-start;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .modal-body {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
      `}</style>

      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your business information and billing preferences.</p>
        </div>

        <div className="cards-grid">
          {settingCards.map((card, idx) => (
            <div 
              key={idx} 
              className="settings-card-item"
              onClick={() => { if(card.path !== '#') navigate(card.path); }}
            >
              <div className="setting-icon-wrapper">
                {card.icon}
              </div>
              <div className="setting-content">
                <span className="setting-label">{card.title}</span>
                <span className="setting-desc">{card.description}</span>
              </div>
              <ChevronRight size={24} className="setting-arrow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
