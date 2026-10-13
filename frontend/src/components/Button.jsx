import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  className = '',
  style = {}
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem 1.25rem',
    borderRadius: 'var(--radius-md, 10px)',
    fontWeight: '600',
    fontSize: 'var(--font-size-sm)',
    transition: 'all 0.2s ease',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.65 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.01em',
    transform: 'translateY(0)',
  };

  const variants = {
    primary: {
      background: 'var(--gradient-brand, linear-gradient(135deg, #059669 0%, #10b981 100%))',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-card, #ffffff)',
      color: 'var(--color-text-main, #0f172a)',
      border: '1px solid var(--color-border, #e2e8f0)',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      backgroundColor: 'var(--color-error, #ef4444)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary, #4f46e5)',
      border: '1px solid var(--color-border, #c7d2fe)',
    }
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variants[variant], ...style }}
      className={className}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
};

export default Button;
