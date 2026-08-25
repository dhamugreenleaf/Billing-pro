import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  className = ''
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    fontSize: 'var(--font-size-sm)',
    transition: 'all 0.3s ease',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.7 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.01em',
    transform: 'translateY(0)',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-card)',
      color: 'var(--color-text-main)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      backgroundColor: 'var(--color-error)',
      color: 'white',
      boxShadow: 'var(--shadow-sm)',
    }
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variants[variant] }}
      className={className}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
};

export default Button;
