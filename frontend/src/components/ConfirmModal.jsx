import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = true, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            backgroundColor: isDestructive ? '#fee2e2' : '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={24} color={isDestructive ? '#dc2626' : '#2563eb'} />
          </div>
          
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
            {title}
          </h3>
          
          <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              {cancelText}
            </button>
            
            <button 
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: isDestructive ? '#dc2626' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = isDestructive ? '#b91c1c' : '#1d4ed8')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = isDestructive ? '#dc2626' : '#2563eb')}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
