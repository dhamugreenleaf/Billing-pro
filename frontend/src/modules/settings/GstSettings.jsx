import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Percent } from 'lucide-react';
import api from '../../utils/api';

const GstSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');

  // The customer's selected default GST rate (e.g. 18%)
  const [defaultGstRate, setDefaultGstRate] = useState(18);

  // The list of GST rates allowed by Admin
  const [allowedGstRates, setAllowedGstRates] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch Admin GST settings to see what rates are allowed
        const globalRes = await api.get('/settings/global');
        if (globalRes.data?.gst_settings?.availableGstRates) {
          const rates = globalRes.data.gst_settings.availableGstRates
            .filter(r => r.enabled)
            .map(r => r.rate);
          setAllowedGstRates(rates);
        }

        // Fetch Customer specific settings
        const customerRes = await api.get('/settings');
        if (customerRes.data && customerRes.data.default_gst_rate !== undefined) {
          setDefaultGstRate(customerRes.data.default_gst_rate);
        }
      } catch (err) {
        console.error('Could not fetch GST settings', err);
        setAllowedGstRates([5, 12, 18, 28]);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSelectRate = (rate) => {
    setDefaultGstRate(rate);
  };

  const handleApplyGst = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.put('/settings', { default_gst_rate: defaultGstRate });
      setSuccess('GST rate applied successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setSuccess('Failed to save GST rate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gst-container">
      <style>{`
        .gst-container {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
          padding: 2rem 1rem 6rem 1rem;
        }
        
        .gst-wrapper {
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
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .back-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0.25rem 0 0 0;
        }

        .settings-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          margin-bottom: 2rem;
        }

        .card-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .card-desc {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.5;
        }

        .card-body {
          padding: 2rem;
        }

        .current-rate-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .current-rate-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .current-rate-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2563eb;
        }

        .rates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .rate-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: #ffffff;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }

        .rate-card:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .rate-card.selected {
          background: #eff6ff;
          border-color: #2563eb;
        }

        .rate-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .rate-card.selected .rate-value {
          color: #1d4ed8;
        }

        .rate-status {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .rate-card.selected .rate-status {
          color: #2563eb;
        }

        .checkmark-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          color: #2563eb;
          display: none;
        }

        .rate-card.selected .checkmark-icon {
          display: block;
        }

        .action-footer {
          display: flex;
          justify-content: flex-end;
        }

        .btn-primary {
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #2563eb;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-size: 1rem;
          width: 100%;
          justify-content: center;
        }
        
        @media (min-width: 640px) {
          .btn-primary {
            width: auto;
          }
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .success-toast {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }
      `}</style>

      <div className="gst-wrapper">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/settings')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">GST Settings</h1>
            <p className="page-subtitle">
              Choose the GST rate that should be used when creating invoices.
            </p>
          </div>
        </div>

        {success && <div className="success-toast">{success}</div>}

        <div className="settings-card">
          <div className="card-header">
            <h2 className="card-title">Default GST Rate</h2>
            <p className="card-desc">
              This selected rate will automatically apply to all your new invoices. You cannot change the GST rate individually during invoice creation.
            </p>
          </div>
          <div className="card-body">
            <div className="current-rate-box">
              <div className="current-rate-label">Current Default Rate</div>
              <div className="current-rate-value">{defaultGstRate}%</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleApplyGst}>
          <div className="settings-card">
            <div className="card-header">
              <h2 className="card-title">Available GST Rates</h2>
              <p className="card-desc">
                Select your preferred default rate from the options currently allowed by the administrator.
              </p>
            </div>
            
            <div className="card-body">
              {fetching ? (
                <div className="empty-state">Loading allowed rates...</div>
              ) : allowedGstRates.length === 0 ? (
                <div className="empty-state">No GST rates are currently enabled by the administrator.</div>
              ) : (
                <div className="rates-grid">
                  {allowedGstRates.map((rate) => {
                    const isSelected = rate === defaultGstRate;
                    return (
                      <div 
                        key={rate} 
                        className={`rate-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectRate(rate)}
                      >
                        <Check size={18} className="checkmark-icon" strokeWidth={3} />
                        <div className="rate-value">{rate}%</div>
                        <div className="rate-status">{isSelected ? 'Default' : 'Available'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="action-footer">
            <button type="submit" className="btn-primary" disabled={loading || allowedGstRates.length === 0}>
              {loading ? 'Applying...' : 'Apply GST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GstSettings;
