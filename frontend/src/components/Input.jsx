import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  filterType, // 'name', 'mobile', 'amount'
  onChange,
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
      // Allow only digits, max 10
      value = value.replace(/[^0-9]/g, '');
      if (value.length > 10) value = value.substring(0, 10);
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
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-bg-input)',
    color: 'var(--color-text-main)',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input 
        ref={ref}
        type={type === 'number' ? 'text' : type} // Use text to allow manual filtering for numbers
        onChange={handleInput}
        style={inputStyle}
        {...props} 
      />
      {error && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>{error}</span>}
    </div>
  );
});

export default Input;
