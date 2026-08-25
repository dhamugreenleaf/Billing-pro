import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceService } from './InvoiceService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_mobile: '',
    customer_name: '',
    customer_address: '',
    description: '',
    amount: '',
    payment_method: 'UPI',
    gst_enabled: false,
    gst_rate: 18,
    gst_price_type: 'exclusive',
    place_of_supply: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // GST States
  const [allowedGstRates, setAllowedGstRates] = useState([]);
  const [isGstReady, setIsGstReady] = useState(false);
  
  // Customer Dropdown States
  const [customersList, setCustomersList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchGstConfig = async () => {
      try {
        const [globalRes, customerRes] = await Promise.all([
          api.get('/settings/global'),
          api.get('/settings')
        ]);

        let rates = [5, 12, 18, 28];
        if (globalRes.data?.gst_settings?.availableGstRates) {
          rates = globalRes.data.gst_settings.availableGstRates
            .filter(r => r.enabled)
            .map(r => r.rate);
          setAllowedGstRates(rates);
        }

        let activeRate = 18;
        if (customerRes.data && customerRes.data.default_gst_rate !== undefined) {
          activeRate = customerRes.data.default_gst_rate;
        }

        if (rates.length > 0 && !rates.includes(activeRate)) {
          activeRate = rates.includes(18) ? 18 : rates[0];
        } else if (rates.length === 0) {
          activeRate = 0;
        }

        setFormData(prev => ({ ...prev, gst_rate: activeRate }));
      } catch (err) {
        console.error('Could not fetch GST configs', err);
        setAllowedGstRates([5, 12, 18, 28]);
      } finally {
        setIsGstReady(true);
      }
    };

    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        if (res.data) setCustomersList(res.data);
      } catch (err) {
        console.error('Could not fetch customers list', err);
      }
    };

    fetchGstConfig();
    fetchCustomers();
  }, []);

  // Calculate Summary
  let summarySubtotal = Number(formData.amount) || 0;
  let summaryTaxAmount = 0;
  let summaryTotal = summarySubtotal;

  if (formData.gst_enabled && summarySubtotal > 0) {
    const rate = Number(formData.gst_rate);
    summaryTaxAmount = (summarySubtotal * rate) / 100;
    summaryTotal = summarySubtotal + summaryTaxAmount;
  }

  const handleChange = async (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'customer_mobile') {
      if (value.length > 0) {
        const matches = customersList.filter(c => c.mobile_number && c.mobile_number.includes(value));
        setFilteredCustomers(matches);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }

      // Auto-fetch customer details if 10-digit mobile is entered
      if (value.length === 10) {
        const localMatch = customersList.find(c => c.mobile_number === value);
        if (localMatch) {
          setFormData(prev => ({
            ...prev,
            customer_name: localMatch.name || prev.customer_name,
            customer_address: localMatch.address || prev.customer_address
          }));
          setShowDropdown(false);
        } else {
          try {
            const res = await api.get(`/customers/mobile/${value}`);
            if (res.data) {
              setFormData(prev => ({
                ...prev,
                customer_name: res.data.name || prev.customer_name,
                customer_address: res.data.address || prev.customer_address
              }));
            }
          } catch (err) {
            // Customer not found, ignore silently
          }
        }
      }
    }
  };

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customer_mobile: customer.mobile_number,
      customer_name: customer.name || prev.customer_name,
      customer_address: customer.address || prev.customer_address
    }));
    setShowDropdown(false);
  };

  const setGstEnabled = (enabled) => {
    setFormData({ ...formData, gst_enabled: enabled });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.customer_mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    if (!formData.customer_name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.customer_address.trim()) {
      setError('Customer address is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }



    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        gst_rate: formData.gst_enabled ? Number(formData.gst_rate) : 0,
        place_of_supply: formData.gst_enabled ? 'Tamil Nadu' : '',
      };
      
      const res = await InvoiceService.generateInvoice(payload);
      // Wait to redirect. Format selection will happen in Preview page.
      navigate(`/invoice/${res.data.id}/preview?generated=true`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-wrapper" style={{ marginTop: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', marginRight: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}
        >
          <ArrowLeft size={24} color="var(--color-text-main)" />
        </button>
        <h2 style={{ margin: 0 }}>Create Invoice</h2>
      </div>
      
      <div className="card">
        {error && <div style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-md)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div ref={wrapperRef} style={{ position: 'relative' }}>
            <Input 
              name="customer_mobile"
              label="Customer Mobile *"
              placeholder="Enter customer mobile number"
              filterType="mobile"
              value={formData.customer_mobile}
              onChange={handleChange}
              onFocus={() => {
                if (formData.customer_mobile.length > 0 && filteredCustomers.length > 0) {
                  setShowDropdown(true);
                }
              }}
              autoFocus
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '72px',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {filteredCustomers.map(customer => (
                  <li 
                    key={customer.id} 
                    onClick={() => selectCustomer(customer)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{customer.mobile_number}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{customer.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <Input 
            name="customer_name"
            label="Customer Name *"
            placeholder="Enter customer name"
            filterType="name"
            value={formData.customer_name}
            onChange={handleChange}
          />
          <Input 
            name="customer_address"
            label="Customer Address *"
            placeholder="Enter customer address"
            filterType="address"
            value={formData.customer_address}
            onChange={handleChange}
          />
          <Input 
            name="description"
            label="What is this bill for? *"
            placeholder="e.g. Professional Services"
            value={formData.description}
            onChange={handleChange}
          />
          <Input 
            name="amount"
            label="Amount (₹) *"
            placeholder="0.00"
            filterType="amount"
            value={formData.amount}
            onChange={handleChange}
          />

          <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GST</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div 
                onClick={() => setGstEnabled(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1px solid ${!formData.gst_enabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ fontWeight: '500', color: !formData.gst_enabled ? 'var(--color-primary)' : 'var(--color-text-main)' }}>Without GST</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Simple Bill</div>
              </div>
              <div 
                onClick={() => setGstEnabled(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1px solid ${formData.gst_enabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ fontWeight: '500', color: formData.gst_enabled ? 'var(--color-primary)' : 'var(--color-text-main)' }}>With GST</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>GST Invoice</div>
              </div>
            </div>
          </div>

          {formData.gst_enabled && isGstReady && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontWeight: '600', color: '#1e3a8a' }}>
                  GST Rate: {formData.gst_rate}%
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                  Configured in Settings
                </div>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '1.5rem',
            marginTop: '1rem'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Invoice Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#475569' }}>Subtotal</span>
              <span style={{ fontWeight: '500' }}>₹{summarySubtotal.toFixed(2)}</span>
            </div>
            {formData.gst_enabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>Tax ({formData.gst_rate}%)</span>
                <span style={{ fontWeight: '500' }}>₹{summaryTaxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', marginTop: '4px' }}>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>Grand Total</span>
              <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '18px' }}>₹{summaryTotal.toFixed(2)}</span>
            </div>
          </div>


          
          <div className="form-group">
            <label>Payment Method</label>
            <select 
              name="payment_method"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-md)',
                backgroundColor: 'var(--color-bg-input)'
              }}
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          
          <Button type="submit" fullWidth loading={loading} className="mt-4">
            {loading ? 'Generating Bill...' : 'Generate Bill'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
