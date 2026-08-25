import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';

const defaultRates = [
  { rate: 0, enabled: true, description: 'Exempt / Zero-rated' },
  { rate: 5, enabled: true, description: 'GST Rate' },
  { rate: 12, enabled: true, description: 'GST Rate' },
  { rate: 18, enabled: true, description: 'GST Rate' },
  { rate: 28, enabled: true, description: 'GST Rate' }
];

const defaultSettings = {
  defaultGstRate: 18,
  availableGstRates: JSON.parse(JSON.stringify(defaultRates)),
  calculationMethod: "exclusive",
  taxType: "cgst_sgst",
  gstinDetails: {
    gstin: '',
    state: '',
    registrationType: 'Regular'
  },
  invoiceTaxDisplay: {
    showGstin: true,
    showTaxBreakdown: true,
    showCgstSgstSeparately: true,
    showIgstSeparately: false,
    showHsnSac: true
  }
};

const AdminGstSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data && response.data.gst_settings) {
          const loaded = { ...defaultSettings, ...response.data.gst_settings };
          setSettings(loaded);
          setOriginalSettings(loaded);
        } else if (response.data && response.data.default_gst_rate) {
          // Fallback for old structure
          const loaded = { ...defaultSettings, defaultGstRate: response.data.default_gst_rate };
          setSettings(loaded);
          setOriginalSettings(loaded);
        }
      } catch (err) {
        console.error('Failed to load global settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings));
  };

  const updateGstinDetails = (field, value) => {
    updateSettings({
      gstinDetails: { ...settings.gstinDetails, [field]: value }
    });
  };

  const updateDisplaySettings = (field, value) => {
    updateSettings({
      invoiceTaxDisplay: { ...settings.invoiceTaxDisplay, [field]: value }
    });
  };

  const toggleRate = (index) => {
    const newRates = [...settings.availableGstRates];
    newRates[index].enabled = !newRates[index].enabled;
    
    let newDefault = settings.defaultGstRate;
    // If we disabled the default rate, switch default to the first available
    if (!newRates[index].enabled && settings.defaultGstRate === newRates[index].rate) {
      const firstEnabled = newRates.find(r => r.enabled);
      if (firstEnabled) {
        newDefault = firstEnabled.rate;
      }
    }
    
    updateSettings({ availableGstRates: newRates, defaultGstRate: newDefault });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, we might send the whole object or merge it with existing settings
      await api.put('/admin/settings', { gst_settings: settings });
      
      setOriginalSettings(settings);
      setHasChanges(false);
      showToast('GST settings updated successfully.');
    } catch (err) {
      console.error('Failed to save', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    updateSettings({
      defaultGstRate: 18,
      availableGstRates: JSON.parse(JSON.stringify(defaultRates)),
      calculationMethod: "exclusive",
      taxType: "cgst_sgst"
      // Note: intentionally NOT resetting gstinDetails or invoiceTaxDisplay
    });
    setShowResetConfirm(false);
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading GST settings...</div>;

  const totalRates = settings.availableGstRates.length;
  const activeRates = settings.availableGstRates.filter(r => r.enabled).length;

  return (
    <div className="gst-settings-container">
      <style>{`
        .gst-settings-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 24px 100px 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #0f172a;
        }
        .page-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }
        .btn-reset {
          background: #ffffff;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-reset:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .summary-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        .admin-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 24px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .admin-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #0f172a;
        }
        .admin-card-desc {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.5;
        }
        .admin-card-body {
          padding: 24px;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th {
          text-align: left;
          padding: 12px 24px;
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 0.875rem;
          vertical-align: middle;
        }
        .admin-table tr:last-child td {
          border-bottom: none;
        }
        .font-semibold { font-weight: 600; }
        .text-muted { color: #64748b; }
        .text-right { text-align: right; }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-enabled {
          background: #f0fdf4;
          color: #16a34a;
        }
        .status-disabled {
          background: #f1f5f9;
          color: #64748b;
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          padding: 0;
        }
        .toggle-switch.on { background: #2563eb; }
        .toggle-switch.off { background: #cbd5e1; }
        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .toggle-switch.on .toggle-thumb {
          transform: translateX(20px);
        }

        .info-section {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .info-icon {
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .info-content h4 {
          margin: 0 0 8px 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }
        .info-content p {
          margin: 0 0 12px 0;
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
        }
        .info-example {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.6;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }
        .form-control {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 0.875rem;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-control:disabled {
          background: #f8fafc;
          color: #94a3b8;
        }
        .form-helper {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.4;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .toggle-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .toggle-row-label {
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .save-bar-sticky {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }
        /* Override if inside a layout with sidebar */
        @media (min-width: 1024px) {
          .save-bar-sticky {
            left: 250px; /* Assuming standard admin sidebar width, adjust as needed */
          }
        }
        .unsaved-text {
          color: #b45309;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .save-actions {
          display: flex;
          gap: 12px;
          margin-left: auto;
        }
        .btn-cancel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-cancel:hover { background: #f8fafc; }
        .btn-primary {
          background: #2563eb;
          border: 1px solid #2563eb;
          color: white;
          padding: 8px 24px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled {
          background: #93c5fd;
          border-color: #93c5fd;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        .modal-title { margin: 0 0 12px 0; font-size: 1.25rem; font-weight: 600; color: #0f172a; }
        .modal-body { color: #475569; font-size: 0.875rem; margin-bottom: 24px; line-height: 1.5; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; }

        .toast-container {
          position: fixed;
          bottom: 90px;
          right: 24px;
          z-index: 1001;
        }
        .toast {
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; gap: 16px; }
          .admin-table thead { display: none; }
          .admin-table tbody tr {
            display: flex;
            flex-direction: column;
            padding: 16px 24px;
            border-bottom: 1px solid #e2e8f0;
            position: relative;
          }
          .admin-table tbody td {
            padding: 6px 0;
            border: none;
          }
          .admin-table td.text-right {
            position: absolute;
            top: 20px;
            right: 24px;
          }
          .save-bar-sticky { padding: 12px 16px; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">GST Settings</h1>
          <p className="page-subtitle">Manage the GST rates and tax rules available across the billing platform.</p>
        </div>
        <button className="btn-reset" onClick={() => setShowResetConfirm(true)}>
          <RefreshCw size={16} /> Reset Defaults
        </button>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total GST Rates</span>
          <span className="summary-value">{totalRates}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active Rates</span>
          <span className="summary-value" style={{ color: '#16a34a' }}>{activeRates}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Default Rate</span>
          <span className="summary-value" style={{ color: '#2563eb' }}>{settings.defaultGstRate}%</span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Available GST Rates</h3>
          <p className="admin-card-desc">Control which GST rates customers can select when creating invoices.</p>
        </div>
        
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>GST Rate</th>
                <th>Description</th>
                <th>Customer Availability</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.availableGstRates.map((rateObj, index) => (
                <tr key={rateObj.rate}>
                  <td className="font-semibold">{rateObj.rate}%</td>
                  <td className="text-muted">{rateObj.description}</td>
                  <td>{rateObj.enabled ? 'Available to customers' : 'Hidden from customers'}</td>
                  <td>
                    <span className={`status-badge ${rateObj.enabled ? 'status-enabled' : 'status-disabled'}`}>
                      {rateObj.enabled ? '● Enabled' : '○ Disabled'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button 
                      className={`toggle-switch ${rateObj.enabled ? 'on' : 'off'}`}
                      onClick={() => toggleRate(index)}
                      title={rateObj.enabled ? 'Disable Rate' : 'Enable Rate'}
                    >
                      <div className="toggle-thumb"></div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="info-section">
          <Info className="info-icon" size={20} />
          <div className="info-content">
            <h4>Customer Selection</h4>
            <p>Customers will only see GST rates that are enabled by the administrator.</p>
            <div className="info-example">
              <strong>Example:</strong> Admin enables 5%, 12%, 18%.<br/>
              Customer invoice dropdown: <code>[ 18% ▼ ]</code> (Options: 5%, 12%, 18%)<br/>
              If Admin disables 12%, it automatically disappears from the customer's options.
            </div>
          </div>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Default GST Rate</h3>
            <p className="admin-card-desc">Choose the GST rate that should be selected automatically when a customer creates a new invoice.</p>
          </div>
          <div className="admin-card-body">
            <div className="form-group">
              <select 
                className="form-control"
                value={settings.defaultGstRate}
                onChange={(e) => updateSettings({ defaultGstRate: parseInt(e.target.value) })}
              >
                {settings.availableGstRates.filter(r => r.enabled).length > 0 ? (
                  settings.availableGstRates.filter(r => r.enabled).map(r => (
                    <option key={r.rate} value={r.rate}>{r.rate}%</option>
                  ))
                ) : (
                  <option value="" disabled>No rates enabled</option>
                )}
              </select>
              <small className="form-helper">Available options only contain currently enabled GST rates.</small>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Tax Calculation</h3>
            <p className="admin-card-desc">Configure the primary logic for computing tax totals.</p>
          </div>
          <div className="admin-card-body form-grid">
            <div className="form-group">
              <label className="form-label">Calculation Method</label>
              <select 
                className="form-control"
                value={settings.calculationMethod}
                onChange={(e) => updateSettings({ calculationMethod: e.target.value })}
              >
                <option value="exclusive">Exclusive</option>
                <option value="inclusive">Inclusive</option>
              </select>
              <small className="form-helper">Exclusive adds GST. Inclusive extracts GST.</small>
            </div>
            <div className="form-group">
              <label className="form-label">Tax Type</label>
              <select 
                className="form-control"
                value={settings.taxType}
                onChange={(e) => updateSettings({ taxType: e.target.value })}
              >
                <option value="cgst_sgst">CGST + SGST</option>
                <option value="igst">IGST</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">GST Registration Details</h3>
            <p className="admin-card-desc">Platform-level business registration info.</p>
          </div>
          <div className="admin-card-body">
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Registration Type</label>
              <select 
                className="form-control"
                value={settings.gstinDetails.registrationType}
                onChange={(e) => updateGstinDetails('registrationType', e.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
                <option value="Unregistered">Unregistered</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">GSTIN</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="22AAAAA0000A1Z5"
                value={settings.gstinDetails.gstin}
                onChange={(e) => updateGstinDetails('gstin', e.target.value)}
                disabled={settings.gstinDetails.registrationType === 'Unregistered'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State / Union Territory</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Maharashtra"
                value={settings.gstinDetails.state}
                onChange={(e) => updateGstinDetails('state', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Invoice Tax Display</h3>
            <p className="admin-card-desc">Control what tax information is visible on generated invoices.</p>
          </div>
          <div className="admin-card-body" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
            <div className="toggle-row">
              <span className="toggle-row-label">Show GSTIN on Invoice</span>
              <button 
                className={`toggle-switch ${settings.invoiceTaxDisplay.showGstin ? 'on' : 'off'}`}
                onClick={() => updateDisplaySettings('showGstin', !settings.invoiceTaxDisplay.showGstin)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
            <div className="toggle-row">
              <span className="toggle-row-label">Show Tax Breakdown</span>
              <button 
                className={`toggle-switch ${settings.invoiceTaxDisplay.showTaxBreakdown ? 'on' : 'off'}`}
                onClick={() => updateDisplaySettings('showTaxBreakdown', !settings.invoiceTaxDisplay.showTaxBreakdown)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
            <div className="toggle-row">
              <span className="toggle-row-label">Show CGST / SGST Separately</span>
              <button 
                className={`toggle-switch ${settings.invoiceTaxDisplay.showCgstSgstSeparately ? 'on' : 'off'}`}
                onClick={() => updateDisplaySettings('showCgstSgstSeparately', !settings.invoiceTaxDisplay.showCgstSgstSeparately)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
            <div className="toggle-row">
              <span className="toggle-row-label">Show IGST Separately</span>
              <button 
                className={`toggle-switch ${settings.invoiceTaxDisplay.showIgstSeparately ? 'on' : 'off'}`}
                onClick={() => updateDisplaySettings('showIgstSeparately', !settings.invoiceTaxDisplay.showIgstSeparately)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
            <div className="toggle-row">
              <span className="toggle-row-label">Show HSN / SAC Code</span>
              <button 
                className={`toggle-switch ${settings.invoiceTaxDisplay.showHsnSac ? 'on' : 'off'}`}
                onClick={() => updateDisplaySettings('showHsnSac', !settings.invoiceTaxDisplay.showHsnSac)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="save-bar-sticky">
        <div style={{ flex: 1 }}>
          {hasChanges && (
            <span className="unsaved-text">
              <AlertCircle size={16} /> Unsaved changes
            </span>
          )}
        </div>
        <div className="save-actions">
          {hasChanges && (
            <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reset Defaults?</h3>
            <p className="modal-body">
              This will restore all GST rates to enabled, reset the default rate to 18%, and reset tax calculation rules. 
              <br/><br/>
              Your GST registration details and invoice display settings will <strong>not</strong> be affected.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#0f172a', borderColor: '#0f172a' }} onClick={handleResetDefaults}>
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} /> {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGstSettings;
