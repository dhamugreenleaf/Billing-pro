import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  filterType, // 'name', 'mobile', 'amount'
  onChange,
  style = {},
  containerStyle = {},
  labelStyle = {},
  className = '',
  ...props 
}, ref) => {
  
  const handleInput = (e) => {
    let value = e.target.value;
    
    // Strict Input Filtering
    if (filterType === 'name' || filterType === 'address') {
      if (filterType === 'name') {
        // Allow only letters and spaces
        value = value.replace(/[^a-zA-Z\s]/g, '');
      }
      // Capitalize the first letter of each word
      value = value.replace(/\b\w/g, char => char.toUpperCase());
    } else if (filterType === 'mobile') {
      // Allow only digits
      let digits = value.replace(/[^0-9]/g, '');
      // Strip leading country code 91 if pasted with 12 digits, or 0 if 11 digits
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      value = digits.substring(0, 10);
    } else if (filterType === 'amount') {
      // Allow only digits and decimal point
      value = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimals
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
      }
    }

    if (e.target.value !== value) {
      e.target.value = value;
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md, 10px)',
    border: `1px solid ${error ? 'var(--color-error, #ef4444)' : 'var(--color-border, #e2e8f0)'}`,
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-bg-input, #ffffff)',
    color: 'var(--color-text-main, #0f172a)',
    outline: 'none',
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <div className={`form-group ${className}`.trim()} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', ...containerStyle }}>
      {label && (
        <label style={{ 
          marginBottom: '0.35rem', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          color: 'var(--color-text-muted, #475569)',
          ...labelStyle
        }}>
          {label}
        </label>
      )}
      <input 
        ref={ref}
        type={type === 'number' ? 'text' : type} // Use text to allow manual filtering for numbers
        onChange={handleInput}
        style={inputStyle}
        {...props} 
      />
      {error && <span style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.75rem', marginTop: '4px' }}>{error}</span>}
    </div>
  );
});

export default Input;
