import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceService } from './InvoiceService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  User, 
  ShoppingBag, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Search, 
  X,
  CreditCard,
  Building,
  Sparkles,
  Receipt,
  CheckCircle,
  Eye,
  Info,
  Sun,
  Moon,
  FileText,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTheme from '../../utils/useTheme';
import api from '../../utils/api';
import { INDIAN_STATES } from '../../utils/indianLocations';

const ALL_FORMAT_OPTIONS = [
  { id: 'tally', name: 'Tally Style (GST)', icon: '📊', badge: 'Official GST', desc: 'Classic Tally Prime layout with tax audit and HSN summary tables.' },
  { id: 'standard', name: 'Standard A4', icon: '📄', badge: 'Corporate', desc: 'Clean corporate tax invoice with complete customer, shipping, and company details.' },
  { id: 'retail', name: 'Retail POS Slip', icon: '🧾', badge: 'Counter POS', desc: 'Compact thermal receipt format optimized for quick counter retail sales and POS printers.' },
  { id: 'modern', name: 'Modern Tax', icon: '🎨', badge: 'Modern Design', desc: 'Fresh modern tax layout with colored branding accents and crisp itemized columns.' },
  { id: 'classic', name: 'Classic Cash Memo', icon: '📜', badge: 'Traditional', desc: 'Traditional merchant cash memo for quick receipts, cash sales, and counter billing.' },
  { id: 'wholesale', name: 'Wholesale B2B', icon: '📦', badge: 'B2B Trade', desc: 'Designed for bulk trade with transport mode, vehicle number, and dual GST columns.' },
  { id: 'advanced', name: 'Advanced GST', icon: '⚡', badge: 'Audit Detailed', desc: 'Comprehensive GST invoice with complete CGST, SGST, IGST breakdown audit tables.' },
  { id: 'service', name: 'Service Bill', icon: '💼', badge: 'Professional', desc: 'Tailored for consulting, freelancers, agencies, and professional services.' },
  { id: 'premium', name: 'Premium Luxury', icon: '✨', badge: 'Executive', desc: 'High-end luxury styling with sleek dark accents, borders, and executive aesthetics.' },
  { id: 'proforma', name: 'Proforma Invoice', icon: '📋', badge: 'Quotation', desc: 'Formal estimate / proforma invoice format for advance quotation before delivery.' }
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const QUICK_ITEM_PRESETS = [
  { name: 'General Retail', price: 100 },
  { name: 'Consultation Fee', price: 500 },
  { name: 'Service / Repair', price: 350 },
  { name: 'Labour Charges', price: 200 }
];

const NOTE_PRESETS = [
  "Thank you for your business!",
  "Goods once sold cannot be returned.",
  "Payment due within 15 days.",
  "Warranty valid for 1 year from bill date."
];

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Screen Step: 'form' (Bill items & customer) vs 'choose_format' (Professional format selector)
  const [step, setStep] = useState('form');
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);

  // Mode: 'express' (Fast counter checkout) vs 'pro' (Detailed itemized tax bill)
  const [billingMode, setBillingMode] = useState('express');

  const [formData, setFormData] = useState({
    customer_mobile: '',
    customer_name: '',
    billing_address: '',
    shipping_address: '',
    items: [{ description: 'General Sale', amount: '', quantity: 1, unit_price: '', product_id: null, product_code: '' }],
    payment_method: 'UPI',
    gst_enabled: false,
    gst_rate: 18,
    gst_price_type: 'exclusive',
    place_of_supply: '',
    discount: '',
    notes: '',
    invoice_template: 'tally'
  });
  
  const [sameAddress, setSameAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // GST States
  const [allowedGstRates, setAllowedGstRates] = useState([]);
  const [isGstReady, setIsGstReady] = useState(false);
  const [companyState, setCompanyState] = useState('');
  const [companyData, setCompanyData] = useState(null);
  
  // Customer Dropdown & Autocomplete States
  const [customersList, setCustomersList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Product Catalog Modal & Dropdown States
  const [productsList, setProductsList] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [activeItemIndexForProduct, setActiveItemIndexForProduct] = useState(null);
  
  // Dedicated Product Catalog Box States
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const productDropdownRef = useRef(null);
  const [newProductData, setNewProductData] = useState({
    product_name: '',
    product_code: '',
    category: '',
    selling_price: '',
    purchase_price: '',
    gst_percentage: '',
    hsn_code: '',
    stock_quantity: '',
    unit: '',
    description: '',
    is_active: true
  });

  // Mobile Summary & Live Ticket Drawer States
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [showLiveTicket, setShowLiveTicket] = useState(false);
  const [showCustomizeAccordion, setShowCustomizeAccordion] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [globalRes, customerRes, companyRes] = await Promise.all([
          api.get('/settings/global'),
          api.get('/settings'),
          api.get('/company').catch(() => ({ data: null }))
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
        }

        let sellerState = '';
        if (companyRes.data) {
          setCompanyData(companyRes.data);
          if (companyRes.data.state) {
            sellerState = companyRes.data.state;
            setCompanyState(sellerState);
          }
        }

        setFormData(prev => ({ 
          ...prev, 
          gst_rate: activeRate,
          place_of_supply: prev.place_of_supply || sellerState || ''
        }));
      } catch (err) {
        console.error('Could not fetch configs', err);
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

    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setProductsList(list);
      } catch (err) {
        console.error('Could not fetch products list', err);
      }
    };

    fetchConfigs();
    fetchCustomers();
    fetchProducts();
    toast.success('⚡ Express Bill opened successfully! Fast counter billing ready.', { id: 'express-bill-welcome' });
  }, []);

  // Live Calculations
  const subtotal = formData.items.reduce((sum, item) => {
    const q = Number(item.quantity) || 1;
    const p = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount) || 0;
    return sum + (q * p);
  }, 0);

  const discountVal = Math.min(Number(formData.discount) || 0, subtotal);
  const taxableAmount = Math.max(subtotal - discountVal, 0);

  let taxAmount = 0;
  if (formData.gst_enabled && taxableAmount > 0) {
    const rate = Number(formData.gst_rate) || 0;
    taxAmount = (taxableAmount * rate) / 100;
  }

  const grandTotal = taxableAmount + taxAmount;

  const handleChange = async (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (sameAddress && name === 'billing_address') {
        updated.shipping_address = value;
      }
      return updated;
    });

    if (name === 'customer_mobile') {
      if (value.length > 0) {
        const matches = customersList.filter(c => c.mobile_number && c.mobile_number.includes(value));
        setFilteredCustomers(matches);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }

      if (value.length === 10) {
        const localMatch = customersList.find(c => c.mobile_number === value);
        if (localMatch) {
          const custBilling = localMatch.billing_address || '';
          const custShipping = localMatch.shipping_address || custBilling;
          const isSame = !localMatch.shipping_address || localMatch.shipping_address === localMatch.billing_address;
          setSameAddress(isSame);
          setFormData(prev => ({
            ...prev,
            customer_name: localMatch.name || prev.customer_name,
            billing_address: custBilling || prev.billing_address,
            shipping_address: isSame ? (custBilling || prev.billing_address) : (localMatch.shipping_address || prev.shipping_address)
          }));
          setShowDropdown(false);
        } else {
          try {
            const res = await api.get(`/customers/mobile/${value}`);
            if (res.data) {
              const custBilling = res.data.billing_address || '';
              const custShipping = res.data.shipping_address || custBilling;
              const isSame = !res.data.shipping_address || res.data.shipping_address === res.data.billing_address;
              setSameAddress(isSame);
              setFormData(prev => ({
                ...prev,
                customer_name: res.data.name || prev.customer_name,
                billing_address: custBilling || prev.billing_address,
                shipping_address: isSame ? (custBilling || prev.billing_address) : (res.data.shipping_address || prev.shipping_address)
              }));
            }
          } catch (err) {
            // Silently ignore
          }
        }
      }
    }
  };

  const selectCustomer = (customer) => {
    const custBilling = customer.billing_address || '';
    const custShipping = customer.shipping_address || custBilling;
    const isSame = !customer.shipping_address || customer.shipping_address === customer.billing_address;

    setSameAddress(isSame);
    setFormData(prev => ({
      ...prev,
      customer_mobile: customer.mobile_number,
      customer_name: customer.name || prev.customer_name,
      billing_address: custBilling,
      shipping_address: isSame ? custBilling : (customer.shipping_address || '')
    }));
    setShowDropdown(false);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'unit_price') {
      newItems[index].amount = value;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleQuantityStep = (index, delta) => {
    const newItems = [...formData.items];
    const currentQty = Number(newItems[index].quantity) || 1;
    const nextQty = Math.max(1, currentQty + delta);
    newItems[index].quantity = nextQty;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleQuickAddAmount = (amt) => {
    const newItems = [...formData.items];
    const currentPrice = Number(newItems[0].unit_price || newItems[0].amount || 0);
    const nextPrice = currentPrice + amt;
    newItems[0].unit_price = nextPrice;
    newItems[0].amount = nextPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleQuickAddPreset = (preset) => {
    if (formData.items.length === 1 && !formData.items[0].amount) {
      // Overwrite empty first item
      const newItems = [{
        description: preset.name,
        amount: preset.price,
        unit_price: preset.price,
        quantity: 1,
        product_id: null,
        product_code: ''
      }];
      setFormData(prev => ({ ...prev, items: newItems }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          { description: preset.name, amount: preset.price, unit_price: preset.price, quantity: 1, product_id: null, product_code: '' }
        ]
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', amount: '', quantity: 1, unit_price: '', product_id: null, product_code: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const selectProductForCurrentItem = (product) => {
    if (activeItemIndexForProduct === null) return;
    const newItems = [...formData.items];
    const price = product.selling_price || product.purchase_price || '';
    newItems[activeItemIndexForProduct] = {
      ...newItems[activeItemIndexForProduct],
      product_id: product.id,
      product_code: product.product_code || '',
      description: product.product_name || product.description || '',
      item_name: product.product_name || '',
      unit_price: price,
      amount: price,
      quantity: 1
    };
    setFormData(prev => ({ ...prev, items: newItems }));
    setShowProductModal(false);
    setActiveItemIndexForProduct(null);
  };

  const addProductToBill = (product) => {
    const price = product.selling_price || product.purchase_price || '';
    const isFirstItemEmpty = formData.items.length === 1 && 
      (!formData.items[0].amount || formData.items[0].description === 'General Sale' || !formData.items[0].description);

    if (isFirstItemEmpty) {
      const newItems = [{
        product_id: product.id,
        product_code: product.product_code || '',
        description: product.product_name || '',
        item_name: product.product_name || '',
        unit_price: price,
        amount: price,
        quantity: 1
      }];
      setFormData(prev => ({ ...prev, items: newItems }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id: product.id,
            product_code: product.product_code || '',
            description: product.product_name || '',
            item_name: product.product_name || '',
            unit_price: price,
            amount: price,
            quantity: 1
          }
        ]
      }));
    }
    toast.success(`Added "${product.product_name}" (₹${price})`);
  };

  const handleSaveNewProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!newProductData.selling_price) {
      toast.error('Selling price is required');
      return;
    }
    try {
      setIsSavingProduct(true);
      const res = await api.post('/products', newProductData);
      const created = res?.data || res;
      if (created && (created.id || created.product_name)) {
        setProductsList(prev => [created, ...(Array.isArray(prev) ? prev : [])]);
        addProductToBill(created);
        toast.success(`Created & added "${created.product_name}" to bill!`);
        setShowCreateProductModal(false);
        setNewProductData({
          product_name: '',
          product_code: '',
          category: '',
          selling_price: '',
          purchase_price: '',
          gst_percentage: '',
          hsn_code: '',
          stock_quantity: '',
          unit: '',
          description: '',
          is_active: true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // In express mode, auto-fill standard customer defaults if missing
    let targetMobile = formData.customer_mobile.trim();
    let targetName = formData.customer_name.trim();

    if (billingMode === 'express' && !targetName) {
      targetName = 'Cash Customer';
    }

    if (targetMobile.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!targetName) {
      setError('Customer name is required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalBillingAddress = formData.billing_address.trim() || 'Store Counter';
    const finalShippingAddress = sameAddress ? finalBillingAddress : (formData.shipping_address.trim() || finalBillingAddress || 'Store Counter');
    
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const desc = item.description.trim() || 'Item';
      const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount);
      if (!price || price <= 0) {
        setError(`Please enter a valid amount for ${desc}`);
        return;
      }
    }

    setError('');
    setStep('choose_format');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFormatAndCreate = async (templateId) => {
    if (loading) return;
    setGeneratingTemplateId(templateId);
    setLoading(true);
    setError('');

    let targetMobile = formData.customer_mobile.trim();
    let targetName = formData.customer_name.trim();

    if (billingMode === 'express' && !targetName) {
      targetName = 'Cash Customer';
    }

    const finalBillingAddress = formData.billing_address.trim() || 'Store Counter';
    const finalShippingAddress = sameAddress ? finalBillingAddress : (formData.shipping_address.trim() || finalBillingAddress || 'Store Counter');

    try {
      const payload = {
        ...formData,
        customer_name: targetName,
        customer_mobile: targetMobile,
        billing_address: finalBillingAddress,
        shipping_address: finalShippingAddress,
        discount: discountVal,
        items: formData.items.map(item => {
          const price = Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount);
          return {
            product_id: item.product_id || undefined,
            product_code: item.product_code || undefined,
            item_name: item.item_name || item.description || 'Item',
            description: item.description || 'Item',
            unit_price: price,
            quantity: item.quantity ? Number(item.quantity) : 1,
          };
        }),
        amount: subtotal,
        gst_rate: formData.gst_enabled ? Number(formData.gst_rate) : 0,
        place_of_supply: formData.gst_enabled ? (formData.place_of_supply || companyState || '') : '',
        invoice_template: templateId,
        notes: formData.notes || ''
      };
      
      const res = await InvoiceService.generateInvoice(payload);
      toast.success('Bill Created Successfully!');
      navigate(`/invoice/${res.data.id}/preview?template=${templateId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create bill');
      setStep('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
      setGeneratingTemplateId(null);
    }
  };

  const filteredProducts = productsList.filter(p => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    return (p.product_name && p.product_name.toLowerCase().includes(term)) ||
           (p.product_code && p.product_code.toLowerCase().includes(term));
  });

  const productArray = Array.isArray(productsList) ? productsList : (productsList?.data || []);
  const filteredCatalogProducts = productArray.filter(p => {
    if (!catalogSearch) return true;
    const term = catalogSearch.toLowerCase();
    return (p.product_name && p.product_name.toLowerCase().includes(term)) ||
           (p.product_code && p.product_code.toLowerCase().includes(term)) ||
           (p.category && p.category.toLowerCase().includes(term));
  });

  return (
    <div className="billing-mobile-page">
      {/* Top Header Bar */}
      <header className="billing-mobile-header">
        <div className="billing-header-left">
          <button 
            type="button"
            className="billing-back-btn" 
            onClick={() => {
              if (step === 'choose_format') {
                setStep('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }} 
            title={step === 'choose_format' ? 'Back to Bill Edit' : 'Go Back'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="billing-header-title">
              {step === 'choose_format' ? 'Select Invoice Format' : 'Billing POS'}
            </h1>
            <p className="billing-header-subtitle">
              <span className="pulse-dot" />
              <span>
                {step === 'choose_format' 
                  ? 'Step 2 • Touch a format to create invoice' 
                  : `Live Register • ${companyData?.company_name || 'Retail'}`}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Direct Theme Switcher on Billing Screen */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-main)',
              transition: 'transform 0.15s ease'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" strokeWidth={2.4} /> : <Moon size={17} color="#059669" strokeWidth={2.4} />}
          </button>

          {step === 'form' && (
            <button
              type="button"
              onClick={() => setShowLiveTicket(!showLiveTicket)}
              style={{
                background: showLiveTicket ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                border: `1.5px solid ${showLiveTicket ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: showLiveTicket ? 'var(--color-primary)' : 'var(--color-text-muted)',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Receipt size={14} />
              <span>Ticket</span>
            </button>
          )}
        </div>
      </header>

      {step === 'choose_format' ? (
        <div className="billing-inner-wrap format-selection-screen">
          {/* Format Summary Hero */}
          <div className="format-summary-hero">
            <div className="format-hero-left">
              <div className="format-hero-icon">
                <FileText size={22} />
              </div>
              <div>
                <h2 className="format-hero-title">
                  {formData.customer_name || formData.customer_mobile || 'Walk-in Customer'}
                </h2>
                <p className="format-hero-sub">
                  {formData.items.length} {formData.items.length === 1 ? 'item' : 'items'} • Payment: {formData.payment_method}
                </p>
              </div>
            </div>
            <div className="format-hero-total">
              <span className="format-hero-total-label">Grand Total</span>
              <span className="format-hero-total-val">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '14px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="format-picker-intro">
            <h3 className="format-picker-heading">
              <span>Touch any format to generate bill</span>
              <span>✨</span>
            </h3>
            <p className="format-picker-subtitle">
              Your invoice will only be created once you touch your desired layout format below.
            </p>
          </div>

          {/* Pro Format Grid */}
          <div className="pro-format-grid">
            {ALL_FORMAT_OPTIONS.map((f) => {
              const isGeneratingThis = generatingTemplateId === f.id;
              return (
                <div
                  key={f.id}
                  className={`pro-format-card ${isGeneratingThis ? 'loading-card' : ''}`}
                  onClick={() => handleSelectFormatAndCreate(f.id)}
                >
                  <div>
                    <div className="pro-format-header">
                      <span className="pro-format-icon">{f.icon}</span>
                      <span className="pro-format-badge">{f.badge}</span>
                    </div>
                    <h4 className="pro-format-name">{f.name}</h4>
                    <p className="pro-format-desc">{f.desc}</p>
                  </div>
                  
                  <div className="pro-format-button">
                    {isGeneratingThis ? (
                      <span>Generating {f.name}...</span>
                    ) : (
                      <>
                        <span>Touch to Create Bill</span>
                        <span>→</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingBottom: '32px' }}>
            <button
              type="button"
              onClick={() => { setStep('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                background: 'var(--color-bg-card)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'var(--color-text-main)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Edit Bill Items & Pricing</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="billing-inner-wrap">
        {/* Mode Switcher: Express POS (Fast checkout) vs Professional Detailed Bill */}
        <div className="billing-mode-switcher">
          <button
            type="button"
            className={`mode-tab-btn ${billingMode === 'express' ? 'active' : ''}`}
            onClick={() => {
              if (billingMode !== 'express') {
                setBillingMode('express');
                toast.success('⚡ Express Bill opened successfully! Fast counter billing mode.');
              }
            }}
          >
            <Zap size={15} color={billingMode === 'express' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
            <span>⚡ Express Checkout</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${billingMode === 'pro' ? 'active' : ''}`}
            onClick={() => {
              if (billingMode !== 'pro') {
                setBillingMode('pro');
                toast.success('📝 Detailed Pro Bill opened successfully!');
              }
            }}
          >
            <Sliders size={15} color={billingMode === 'pro' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
            <span>📝 Professional / Detailed Bill</span>
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '14px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: CUSTOMER RECOGNITION */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <span className="billing-card-icon icon-blue">
                  <User size={16} />
                </span>
                Customer
              </h3>

              {formData.customer_name && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, background: 'var(--color-success-light)', padding: '2px 8px', borderRadius: '6px' }}>
                  ✓ {formData.customer_name}
                </span>
              )}
            </div>

            {/* Quick 1-Tap Customer Avatars */}
            {customersList.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div className="quick-chips-strip">
                  {customersList.slice(0, 6).map(c => {
                    const initials = (c.name || 'US').substring(0, 2).toUpperCase();
                    const isSelected = formData.customer_mobile === c.mobile_number;

                    return (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className={`quick-chip ${isSelected ? 'amount-chip' : ''}`}
                      >
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--color-success)' : 'var(--color-border)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}>
                          {initials}
                        </span>
                        <span>{c.name || c.mobile_number}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile Number Input with Floating Autocomplete */}
            <div ref={wrapperRef} style={{ position: 'relative' }}>
              <Input 
                name="customer_mobile"
                label="Customer Mobile Number *"
                placeholder="10-digit mobile number"
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
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 30,
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {filteredCustomers.map(customer => (
                    <li 
                      key={customer.id} 
                      onClick={() => selectCustomer(customer)}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border-subtle, #1e293b)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{customer.name || 'Walk-in'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📱 {customer.mobile_number}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>Select &rarr;</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Customer Name, Billing Address & Shipping Address (Available in both Express & Professional modes) */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <Input 
                  name="customer_name"
                  label={billingMode === 'pro' ? "Customer Name *" : "Customer Name"}
                  placeholder={billingMode === 'pro' ? "e.g. Ramesh Kumar" : "e.g. Ramesh Kumar (or Cash Customer)"}
                  filterType="name"
                  value={formData.customer_name}
                  onChange={handleChange}
                />

                <Input 
                  name="billing_address"
                  label="Billing Address"
                  placeholder="e.g. Shop 4, Market Road, Mumbai"
                  filterType="address"
                  value={formData.billing_address}
                  onChange={handleChange}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                margin: '2px 0 12px',
                padding: '8px 12px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}>
                <input 
                  type="checkbox"
                  id="sameAddressCheck"
                  checked={sameAddress}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSameAddress(checked);
                    if (checked) {
                      setFormData(prev => ({ ...prev, shipping_address: prev.billing_address }));
                    }
                  }}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #4f46e5)', cursor: 'pointer' }}
                />
                <label htmlFor="sameAddressCheck" style={{ fontSize: '0.825rem', color: 'var(--color-text-muted, #475569)', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                  Shipping address is same as billing address
                </label>
              </div>

              {!sameAddress && (
                <Input 
                  name="shipping_address"
                  label="Shipping Address / Delivery Location"
                  placeholder="Enter shipping address"
                  filterType="address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>

          {/* SECTION 2: FAST COUNTER QUICK PRESETS (In Express Mode) */}
          {billingMode === 'express' && (
            <div className="billing-card">
              <div className="billing-card-header">
                <h3 className="billing-card-title">
                  <span className="billing-card-icon icon-emerald">
                    <Sparkles size={16} />
                  </span>
                  Quick Presets & Fast Amount
                </h3>
              </div>

              {/* Fast Amount Tap Buttons (+50, +100, +500) */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Quick Cash / Add Amount (₹)
                </label>
                <div className="quick-chips-strip">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className="quick-chip amount-chip"
                      onClick={() => handleQuickAddAmount(amt)}
                    >
                      <span>+₹{amt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Item Presets */}
              <div>
                <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Popular Counter Items
                </label>
                <div className="quick-chips-strip">
                  {QUICK_ITEM_PRESETS.map((it, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-chip"
                      onClick={() => handleQuickAddPreset(it)}
                    >
                      <span>🏷️</span>
                      <span>{it.name} (₹{it.price})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED SEPARATE PRODUCT CATALOG BOX (DIRECT VIEW - NO CLIPPING) */}
          <div className="billing-card" style={{ border: '1.5px solid var(--color-border)' }}>
            <div className="billing-card-header" style={{ marginBottom: '12px' }}>
              <h3 className="billing-card-title">
                <span className="billing-card-icon icon-indigo">
                  <Package size={16} />
                </span>
                Add from Products ({productArray.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--color-primary-light, #eef2ff)',
                  color: 'var(--color-primary, #4f46e5)',
                  border: '1px solid var(--color-primary-border, #c7d2fe)',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {/* Quick 1-Tap Product Chips */}
            {productArray.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div className="quick-chips-strip">
                  {productArray.slice(0, 8).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="quick-chip"
                      onClick={() => addProductToBill(p)}
                      title={`Click to add ${p.product_name}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <span>📦</span>
                      <span>{p.product_name} (₹{Number(p.selling_price || 0).toFixed(0)})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Search Input */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={productArray.length > 0 ? "Search products by name or code..." : "Search products..."}
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  backgroundColor: 'var(--color-bg-input, #ffffff)',
                  color: 'var(--color-text-main)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Direct Product List (Always Visible) */}
            <div style={{
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              border: '1.5px solid var(--color-border, #e2e8f0)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {filteredCatalogProducts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                    {productArray.length === 0 ? (
                      <>
                        <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📦</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>No products in your catalog yet</div>
                        <p style={{ margin: '4px 0 12px', fontSize: '0.8rem' }}>Add your products once, and add them to bills with 1 tap!</p>
                        <button
                          type="button"
                          onClick={() => setShowCreateProductModal(true)}
                          style={{
                            background: 'var(--color-primary, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Plus size={14} /> Create First Product
                        </button>
                      </>
                    ) : (
                      <>
                        <div>No products found matching "{catalogSearch}"</div>
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          style={{
                            marginTop: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary, #4f46e5)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Clear search
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  filteredCatalogProducts.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      onClick={() => addProductToBill(p)}
                      style={{
                        padding: '11px 14px',
                        borderBottom: idx === filteredCatalogProducts.length - 1 ? 'none' : '1px solid var(--color-border-subtle, #f1f5f9)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle, #f8fafc)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ paddingRight: '10px', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.product_name}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {p.product_code && (
                            <span style={{ background: 'var(--color-bg-subtle, #f1f5f9)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              #{p.product_code}
                            </span>
                          )}
                          {p.category && <span>• {p.category}</span>}
                          {p.gst_percentage > 0 && <span>• GST: {p.gst_percentage}%</span>}
                          {p.stock_quantity !== null && p.stock_quantity !== undefined && (
                            <span style={{ color: Number(p.stock_quantity) <= Number(p.minimum_stock || 0) && Number(p.minimum_stock || 0) > 0 ? '#ef4444' : 'inherit' }}>
                              • Stock: {p.stock_quantity} {p.unit || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-success, #059669)' }}>
                          ₹{Number(p.selling_price || 0).toFixed(2)}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.74rem',
                          color: 'var(--color-primary, #4f46e5)',
                          fontWeight: 700,
                          marginTop: '2px',
                          background: 'var(--color-primary-light, #eef2ff)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          + Add
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: BILL ITEMS */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <span className="billing-card-icon icon-indigo">
                  <ShoppingBag size={16} />
                </span>
                Items in Bill ({formData.items.length})
              </h3>

              {productsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveItemIndexForProduct(0);
                    setShowProductModal(true);
                  }}
                  style={{
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4338ca',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Search size={13} />
                  <span>Inventory</span>
                </button>
              )}
            </div>

            {formData.items.map((item, index) => {
              const itemTotal = (Number(item.quantity) || 1) * (Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount) || 0);

              return (
                <div key={index} className="bill-item-card">
                  <div className="bill-item-header">
                    <span className="bill-item-index">#{index + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {productsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveItemIndexForProduct(index);
                            setShowProductModal(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4f46e5',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                        >
                          Pick Catalog
                        </button>
                      )}
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          className="bill-item-remove-btn"
                          onClick={() => removeItem(index)}
                          title="Remove Item"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description Input */}
                  <Input 
                    name={`item_desc_${index}`}
                    label={index === 0 ? "Item Name / Description *" : "Description *"}
                    placeholder="e.g. Cotton Shirt, Billing Service"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />

                  {/* Quantity Stepper & Price Row */}
                  <div className="bill-item-pricing-grid">
                    <div>
                      <label className="bill-field-label">
                        Qty
                      </label>
                      <div className="stepper-control">
                        <button 
                          type="button" 
                          className="stepper-btn"
                          onClick={() => handleQuantityStep(index, -1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          min="1"
                          className="stepper-input"
                          value={item.quantity || 1}
                          onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <button 
                          type="button" 
                          className="stepper-btn"
                          onClick={() => handleQuantityStep(index, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <Input 
                        name={`item_price_${index}`}
                        label="Price (₹) *"
                        placeholder="0.00"
                        filterType="amount"
                        value={item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        containerStyle={{ marginBottom: 0 }}
                        style={{ height: '42px', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Item Price Details Footer */}
                  <div className="bill-item-footer">
                    <div className="bill-item-calc">
                      <span>{item.quantity || 1}</span>
                      <span className="calc-times">×</span>
                      <span>₹{Number(item.unit_price !== undefined && item.unit_price !== '' ? item.unit_price : item.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="item-total-badge">
                      <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Total:</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addItem}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} color="var(--color-primary)" />
              <span>Add Another Item</span>
            </button>
          </div>


          {/* SECTION 6: CUSTOMIZE TAX & ADVANCED OPTIONS (Accordion) */}
          <div className="billing-card">
            <div 
              className="billing-card-header" 
              style={{ cursor: 'pointer', marginBottom: showCustomizeAccordion ? '12px' : 0, borderBottom: showCustomizeAccordion ? '1px solid var(--color-border)' : 'none' }}
              onClick={() => setShowCustomizeAccordion(!showCustomizeAccordion)}
            >
              <h3 className="billing-card-title">
                <span className="billing-card-icon icon-purple">
                  <Sliders size={16} />
                </span>
                Custom Tax, Discount & Remarks
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>
                {showCustomizeAccordion ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {showCustomizeAccordion && (
              <div>
                {/* GST Toggle */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                    Tax Mode
                  </label>
                  <div className="segmented-pill-group">
                    <div 
                      className={`segmented-pill ${!formData.gst_enabled ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, gst_enabled: false }))}
                    >
                      ⚡ Simple Bill (No Tax)
                    </div>
                    <div 
                      className={`segmented-pill ${formData.gst_enabled ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        gst_enabled: true,
                        place_of_supply: prev.place_of_supply || companyState || ''
                      }))}
                    >
                      🏛️ GST Tax Invoice
                    </div>
                  </div>
                </div>

                {/* GST Rate pills and State */}
                {formData.gst_enabled && (
                  <div style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                        GST Rate (%)
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(allowedGstRates.length > 0 ? allowedGstRates : [5, 12, 18, 28]).map(rate => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, gst_rate: rate }))}
                            style={{
                              flex: 1,
                              minWidth: '50px',
                              padding: '8px',
                              borderRadius: '8px',
                              border: formData.gst_rate === rate ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: formData.gst_rate === rate ? 'var(--color-primary)' : 'var(--color-bg-card)',
                              color: formData.gst_rate === rate ? '#ffffff' : 'var(--color-text-main)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                        Place of Supply
                      </label>
                      <select
                        name="place_of_supply"
                        value={formData.place_of_supply}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-bg-card)',
                          fontSize: '0.85rem',
                          color: 'var(--color-text-main)',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select State / Place of Supply</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s.code} value={s.name}>
                            {s.code} - {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Overall Discount */}
                <div style={{ marginBottom: '14px' }}>
                  <Input 
                    name="discount"
                    label="Flat Discount (₹)"
                    placeholder="0.00"
                    filterType="amount"
                    value={formData.discount}
                    onChange={handleChange}
                    containerStyle={{ marginBottom: '14px' }}
                    style={{ height: '42px', fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>

                {/* Custom Notes */}
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Bill Remarks / Warranty / Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add warranty terms, bank account details..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-card)',
                      color: 'var(--color-text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {NOTE_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          notes: prev.notes ? `${prev.notes}\n${preset}` : preset
                        }))}
                        style={{
                          background: 'var(--color-bg-subtle)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        + {preset.length > 20 ? preset.slice(0, 20) + '...' : preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: LIVE BILL TOTAL SUMMARY */}
          <div className="billing-card" style={{ background: 'var(--color-bg-card)' }}>
            <div className="billing-card-header" style={{ marginBottom: '8px', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>
                Price Details
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                {formData.items.length} {formData.items.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <div className="summary-row">
              <span>Items Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
            </div>

            {discountVal > 0 && (
              <div className="summary-row" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                <span>Discount</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>- ₹{discountVal.toFixed(2)}</span>
              </div>
            )}

            {formData.gst_enabled && (
              <div className="summary-row">
                <span>Tax (GST {formData.gst_rate}%)</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>+ ₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Desktop Direct Submit */}
          <div className="d-none d-md-block" style={{ marginTop: '20px' }}>
            <Button type="button" fullWidth loading={loading} onClick={handleSubmit} style={{ padding: '14px', fontSize: '1rem' }}>
              {loading ? 'Processing...' : 'Proceed to Choose Format ⚡'}
            </Button>
          </div>
        </form>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky-billing-footer">
        <div className="sticky-billing-content">
          <div className="sticky-total-info" onClick={() => setShowSummarySheet(true)}>
            <span className="sticky-total-label">
              Grand Total <Info size={12} />
            </span>
            <span className="sticky-total-amount">₹{grandTotal.toFixed(2)}</span>
          </div>

          <button 
            type="button"
            className="sticky-action-btn"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Choose Format</span>
                <span>⚡</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )}

      {/* LIVE DIGITAL TICKET PREVIEW OVERLAY */}
      {showLiveTicket && (
        <div className="summary-sheet-overlay" onClick={() => setShowLiveTicket(false)}>
          <div className="digital-ticket-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="digital-ticket">
              {/* Ticket Header */}
              <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="verified-stamp">
                    ✓ Official Bill
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowLiveTicket(false)} 
                    style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    {companyData?.company_name || 'Retail Store'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    {companyData?.phone || 'Digital Payment Counter'}
                  </div>
                </div>
              </div>

              {/* Perforated Divider */}
              <div className="ticket-perforation">
                <div className="ticket-punch-left" />
                <div className="ticket-dashed-line" />
                <div className="ticket-punch-right" />
              </div>

              {/* Ticket Body */}
              <div style={{ padding: '14px 20px', backgroundColor: 'var(--color-bg-card, #ffffff)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', marginBottom: '12px' }}>
                  <span>Customer: <strong style={{ color: 'var(--color-text-main, #0f172a)' }}>{formData.customer_name || formData.customer_mobile || 'Walk-in'}</strong></span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>

                {/* Items */}
                <div style={{ borderBottom: '1px dashed var(--color-border, #e2e8f0)', paddingBottom: '10px', marginBottom: '10px' }}>
                  {formData.items.map((it, idx) => {
                    const price = Number(it.unit_price || it.amount || 0);
                    const q = Number(it.quantity || 1);
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', color: 'var(--color-text-main, #0f172a)' }}>
                        <span>{it.description || 'Item'} (x{q})</span>
                        <strong style={{ color: 'var(--color-text-main)' }}>₹{(q * price).toFixed(2)}</strong>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Total Due</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)' }}>₹{grandTotal.toFixed(2)}</span>
                </div>

                {/* Barcode Strip */}
                <div className="barcode-strip" />

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <Button type="button" fullWidth onClick={() => { setShowLiveTicket(false); handleSubmit(); }}>
                    Generate This Bill Now ⚡
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY DRAWER SHEET */}
      {showSummarySheet && (
        <div className="summary-sheet-overlay" onClick={() => setShowSummarySheet(false)}>
          <div className="summary-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="summary-sheet-handle" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--color-text-main)' }}>
              Calculation Breakdown
            </h3>

            <div className="summary-row">
              <span>Subtotal ({formData.items.length} items)</span>
              <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
            </div>

            {discountVal > 0 && (
              <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 700 }}>- ₹{discountVal.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Taxable Subtotal</span>
              <span style={{ fontWeight: 700 }}>₹{taxableAmount.toFixed(2)}</span>
            </div>

            {formData.gst_enabled && (
              <div className="summary-row">
                <span>Tax GST ({formData.gst_rate}%)</span>
                <span style={{ fontWeight: 700 }}>+ ₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '18px' }}>
              <Button type="button" fullWidth onClick={() => setShowSummarySheet(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CATALOG PICKER MODAL */}
      {showProductModal && (
        <div className="summary-sheet-overlay" onClick={() => setShowProductModal(false)}>
          <div className="summary-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="summary-sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                Inventory Catalog
              </h3>
              <button 
                type="button" 
                onClick={() => setShowProductModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search products by name or code..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No products found.
                </div>
              ) : (
                filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => selectProductForCurrentItem(p)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--color-border-subtle, #1e293b)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{p.product_name}</div>
                      {p.product_code && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Code: {p.product_code}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '0.9rem' }}>
                      ₹{Number(p.selling_price || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL (QUICK ADD FROM BILL CREATE) */}
      {showCreateProductModal && (
        <div 
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '10px'
          }}
          onClick={() => setShowCreateProductModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              borderRadius: '18px',
              width: '100%', maxWidth: '580px', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--color-border, #e2e8f0)',
              color: 'var(--color-text-main)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderBottom: '1px solid var(--color-border, #e2e8f0)',
              background: 'var(--color-bg-card, #ffffff)'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-main, #0f172a)', fontWeight: '700' }}>
                Add New Product to Catalog
              </h2>
              <button 
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                style={{
                  background: 'var(--color-bg-subtle, #f1f5f9)', border: 'none', cursor: 'pointer', borderRadius: '50%',
                  padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-muted, #64748b)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
                {/* 1. Product Name */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductData.product_name}
                    onChange={(e) => setNewProductData({ ...newProductData, product_name: e.target.value })}
                    placeholder="e.g. Cotton Shirt, Billing Service"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '10px',
                      border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                      color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Product Code & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={newProductData.product_code}
                      onChange={(e) => setNewProductData({ ...newProductData, product_code: e.target.value })}
                      placeholder="e.g. PRD-01"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={newProductData.category}
                      onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                      placeholder="e.g. Retail / Service"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Selling Price & Purchase Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newProductData.selling_price}
                      onChange={(e) => setNewProductData({ ...newProductData, selling_price: e.target.value })}
                      placeholder="0.00"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Purchase Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProductData.purchase_price}
                      onChange={(e) => setNewProductData({ ...newProductData, purchase_price: e.target.value })}
                      placeholder="0.00"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 4. GST Tax % & HSN/SAC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      GST Tax (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProductData.gst_percentage}
                      onChange={(e) => setNewProductData({ ...newProductData, gst_percentage: e.target.value })}
                      placeholder="0"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      HSN/SAC Code
                    </label>
                    <input
                      type="text"
                      value={newProductData.hsn_code}
                      onChange={(e) => setNewProductData({ ...newProductData, hsn_code: e.target.value })}
                      placeholder="e.g. 9983"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 5. Stock Qty & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newProductData.stock_quantity}
                      onChange={(e) => setNewProductData({ ...newProductData, stock_quantity: e.target.value })}
                      placeholder="e.g. 50"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      Unit
                    </label>
                    <input
                      type="text"
                      value={newProductData.unit}
                      onChange={(e) => setNewProductData({ ...newProductData, unit: e.target.value })}
                      placeholder="e.g. pcs, kg, box"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 6. Description */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                    Description
                  </label>
                  <textarea
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                    placeholder="Product details..."
                    rows="2"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '10px',
                      border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                      color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex', gap: '10px', justifyContent: 'flex-end',
                padding: '12px 18px', borderTop: '1px solid var(--color-border, #e2e8f0)',
                background: 'var(--color-bg-subtle, #f8fafc)'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(false)}
                  style={{
                    padding: '9px 18px', borderRadius: '9px', border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-bg-subtle, #ffffff)', color: 'var(--color-text-muted, #475569)', fontWeight: '600',
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  style={{
                    padding: '9px 20px', borderRadius: '9px', border: 'none',
                    background: 'var(--gradient-brand, #059669)', color: 'white', fontWeight: '700',
                    cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
                    opacity: isSavingProduct ? 0.7 : 1
                  }}
                >
                  {isSavingProduct ? 'Saving...' : 'Save & Add to Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
