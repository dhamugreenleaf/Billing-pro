import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Building2, Image as ImageIcon, Upload, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { updateUser } from '../../redux/authSlice';

const CompanySetup = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: '',
    owner_name: '',
    business_type: '',
    phone: user?.mobile_number || '',
    email: '',
    address: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gst_number: '',
    pan: '',
    registrationType: 'Regular',
    website: '',
    additionalPhone: '',
    description: '',
    logo: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const isEditMode = user?.profile_completed;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/company');
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            company_name: res.data.company_name || '',
            owner_name: res.data.owner_name || user?.name || '',
            business_type: res.data.business_type || '',
            phone: res.data.phone || prev.phone,
            email: res.data.email || '',
            address: res.data.address || '',
            address_line_2: res.data.address_line_2 || '',
            city: res.data.city || '',
            state: res.data.state || '',
            pincode: res.data.pincode || '',
            country: res.data.country || 'India',
            gst_number: res.data.gst_number || '',
            pan: res.data.pan || '',
            registrationType: res.data.registrationType || 'Regular',
            website: res.data.website || '',
            additionalPhone: res.data.additionalPhone || '',
            description: res.data.description || '',
            logo: res.data.logo || ''
          }));
          dispatch(updateUser({ profile_completed: true }));
          
          // If they were sent to /setup because profile_completed was false,
          // but we found their profile on the backend, redirect them to the dashboard immediately.
          if (!user?.profile_completed) {
            navigate('/', { replace: true });
          }
        }
      } catch (err) {
        // Doesn't exist or not set up
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [dispatch, user?.profile_completed, navigate]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 500x500 maintaining aspect ratio for high quality & fast loading
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.9);

        setFormData(prev => ({ ...prev, logo: dataUrl }));
        setError('');
        setSuccess('Logo loaded. Click "Save Changes" at the bottom to apply to invoices.');
        setTimeout(() => setSuccess(''), 4000);
      };
      img.onerror = () => {
        setError('Could not process the selected image.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSuccess('Logo removed. Click "Save Changes" to save.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'company_name' || name === 'owner_name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }

    if (name === 'company_name' || name === 'owner_name' || name === 'address' || name === 'address_line_2' || name === 'city' || name === 'state' || name === 'country') {
      value = value.replace(/\b\w/g, char => char.toUpperCase());
    }

    if (name === 'phone' || name === 'additionalPhone') {
      value = value.replace(/[^0-9+]/g, '');
    }
    
    if (name === 'pincode') {
      value = value.replace(/[^0-9]/g, '');
    }

    if (name === 'gst_number' || name === 'pan') {
      value = value.toUpperCase();
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Phone validation (basic Indian)
    if (formData.phone && formData.phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid phone number.');
      return false;
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    // GSTIN validation (optional unless Regular/Composition, but keeping basic check if provided)
    if (formData.gst_number && formData.gst_number.length !== 15) {
      setError('GSTIN must be exactly 15 characters.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEditMode) {
      if (!formData.company_name.trim() || !formData.address.trim()) {
        setError('Please fill in all required fields (*)');
        return;
      }
    } else {
      if (!formData.company_name.trim() || !formData.phone.trim() || !formData.address.trim()) {
        setError('Please fill in all required fields (*)');
        return;
      }
    }

    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/company', formData);
      dispatch(updateUser({ profile_completed: true }));
      
      if (!isEditMode) {
        navigate('/', { replace: true });
      } else {
        setSuccess('Business profile updated successfully.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center mt-4 text-muted">Loading profile...</div>;

  return (
    <div className="setup-container">
      <style>{`
        .setup-container {
          min-height: 100vh;
          background: var(--color-bg-main, #f8fafc);
          color: var(--color-text-main, #0f172a);
          font-family: 'Inter', sans-serif;
          padding: 2rem 1rem 6rem 1rem;
        }
        
        .setup-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: var(--color-bg-card, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted, #475569);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .back-btn:hover {
          background: var(--color-bg-subtle, #f1f5f9);
          color: var(--color-text-main, #0f172a);
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
          margin: 0;
        }

        .page-subtitle {
          color: var(--color-text-muted, #64748b);
          font-size: 0.95rem;
          margin: 0.25rem 0 0 0;
        }

        .setup-card {
          background: var(--color-bg-card, #ffffff);
          border-radius: 12px;
          border: 1px solid var(--color-border, #e2e8f0);
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          margin-bottom: 2rem;
        }

        .setup-body {
          padding: 2rem;
        }

        .form-section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 2rem 0 1.25rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
        }

        .form-section-title:first-child {
          margin-top: 0;
        }

        .setup-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-main, #334155);
        }

        .setup-input, .setup-textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 6px;
          border: 1px solid var(--color-border, #cbd5e1);
          background: var(--color-bg-card, #ffffff);
          font-size: 0.95rem;
          color: var(--color-text-main, #0f172a);
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .setup-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .setup-input:focus, .setup-textarea:focus {
          border-color: var(--color-primary, #2563eb);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }

        .row-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        
        .logo-upload-wrapper {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem;
          border: 1px dashed var(--color-border, #cbd5e1);
          border-radius: 8px;
          background: var(--color-bg-subtle, #f8fafc);
        }

        .logo-preview {
          width: 80px;
          height: 80px;
          background: var(--color-bg-card, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-subtle, #94a3b8);
        }

        .logo-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .logo-btn-row {
          display: flex;
          gap: 0.5rem;
        }

        .btn-upload {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-bg-card, #ffffff);
          border: 1px solid var(--color-border, #cbd5e1);
          color: var(--color-text-main, #475569);
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-upload:hover {
          background: var(--color-bg-subtle, #f1f5f9);
          color: var(--color-text-main, #0f172a);
        }

        .btn-remove {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-remove:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .submit-btn {
          padding: 0.75rem 1.5rem;
          background: var(--color-primary, #2563eb);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-primary-dark, #1d4ed8);
        }

        .submit-btn:disabled {
          background: var(--color-border, #93c5fd);
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background: var(--color-bg-card, #ffffff);
          color: var(--color-text-main, #475569);
          border: 1px solid var(--color-border, #cbd5e1);
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .cancel-btn:hover {
          background: var(--color-bg-subtle, #f1f5f9);
          color: var(--color-text-main, #0f172a);
        }

        .error-box {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .success-box {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        /* Desktop Adjustments */
        @media (min-width: 768px) {
          .row-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="setup-wrapper">
        <div className="page-header">
          {isEditMode && (
            <button className="back-btn" onClick={() => navigate('/settings')}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="page-title">Profile Settings</h1>
            <p className="page-subtitle">
              Manage your business and contact information.
            </p>
          </div>
        </div>

        <div className="setup-card">
          <div className="setup-body">
            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}

            <form onSubmit={handleSubmit} className="setup-form">
              
              <h3 className="form-section-title">Business Information</h3>
              
              <div className="row-grid">
                <div className="input-group">
                  <label>Company / Business Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="setup-input"
                  />
                </div>
                
                <div className="input-group">
                  <label>Owner Name</label>
                  <input 
                    type="text" 
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="setup-input"
                  />
                </div>
              </div>

              {isEditMode && (
                <div className="row-grid">
                  <div className="input-group">
                    <label>Business Type</label>
                    <select 
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      className="setup-input"
                    >
                      <option value="">Select Type</option>
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Service">Service</option>
                      <option value="Manufacturing">Manufacturing</option>
                    </select>
                  </div>
                </div>
              )}

                <div className="input-group">
                  <label>Business Logo</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                  <div className="logo-upload-wrapper">
                    <div 
                      className="logo-preview" 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                      title="Click to choose a logo image"
                    >
                      {formData.logo ? (
                        <img 
                          src={formData.logo} 
                          alt="Company Logo Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} 
                        />
                      ) : (
                        <ImageIcon size={32} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="logo-actions">
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                        {formData.logo 
                          ? 'Logo active. Will display on all issued invoices.' 
                          : 'Upload a professional logo for your invoices (PNG, JPG, WebP max 5MB).'}
                      </p>
                      <div className="logo-btn-row">
                        {!formData.logo ? (
                          <button 
                            type="button" 
                            className="btn-upload" 
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={16} /> Upload Logo
                          </button>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              className="btn-upload" 
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload size={16} /> Replace
                            </button>
                            <button 
                              type="button" 
                              className="btn-remove" 
                              onClick={handleRemoveLogo}
                            >
                              <Trash2 size={16} /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              {isEditMode && (
                <>
                  <h3 className="form-section-title">Contact Information</h3>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                      <input 
                        type="text" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="setup-input"
                      />
                    </div>
    
                    <div className="input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="setup-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <h3 className="form-section-title">Business Address</h3>

              <div className="input-group">
                <label>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="setup-input"
                />
              </div>

              {isEditMode && (
                <>
                  <div className="input-group">
                    <label>Address Line 2</label>
                    <input 
                      type="text" 
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleChange}
                      className="setup-input"
                    />
                  </div>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="setup-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>State</label>
                      <input 
                        type="text" 
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="setup-input"
                      />
                    </div>
                  </div>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>PIN Code</label>
                      <input 
                        type="text" 
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="setup-input"
                        maxLength={6}
                      />
                    </div>
                    <div className="input-group">
                      <label>Country</label>
                      <input 
                        type="text" 
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="setup-input"
                      />
                    </div>
                  </div>
    
                  <h3 className="form-section-title">Tax Information</h3>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>GST Registration Type</label>
                      <select 
                        name="registrationType"
                        value={formData.registrationType}
                        onChange={handleChange}
                        className="setup-input"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Composition">Composition</option>
                        <option value="Unregistered">Unregistered</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>GSTIN</label>
                      <input 
                        type="text" 
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleChange}
                        maxLength={15}
                        className="setup-input"
                      />
                    </div>
                  </div>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>PAN</label>
                      <input 
                        type="text" 
                        name="pan"
                        value={formData.pan}
                        onChange={handleChange}
                        maxLength={10}
                        className="setup-input"
                      />
                    </div>
                  </div>
    
                  <h3 className="form-section-title">Other Business Details</h3>
    
                  <div className="row-grid">
                    <div className="input-group">
                      <label>Website</label>
                      <input 
                        type="text" 
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="e.g. www.mybusiness.com"
                        className="setup-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Additional Contact Number</label>
                      <input 
                        type="text" 
                        name="additionalPhone"
                        value={formData.additionalPhone}
                        onChange={handleChange}
                        className="setup-input"
                      />
                    </div>
                  </div>
    
                  <div className="input-group">
                    <label>Business Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Short description of your services or products..."
                      className="setup-textarea"
                    />
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        <div className="form-actions">
          {isEditMode && (
            <button type="button" className="cancel-btn" onClick={() => navigate('/settings')}>
              Cancel
            </button>
          )}
          <button type="submit" onClick={handleSubmit} disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Complete Setup')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;
