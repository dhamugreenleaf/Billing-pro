import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get('/admin/invoices');
        setInvoices(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(i => 
    (i.invoice_number && i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.customer_name && i.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.Company?.company_name && i.Company.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Global Bills / Invoices</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Monitor all generated invoices across the platform</p>
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Search invoice #, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem', 
              border: '1px solid #cbd5e1',
              minWidth: '250px'
            }}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Generator (Company)</th>
                <th>Billed To</th>
                <th>Date</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td style={{ fontWeight: '500' }}>{invoice.invoice_number}</td>
                  <td>{invoice.Company?.company_name || 'N/A'}</td>
                  <td>
                    <div>{invoice.customer_name || 'Cash Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{invoice.customer_mobile}</div>
                  </td>
                  <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: '600' }}>₹{Number(invoice.total_amount).toLocaleString('en-IN')}</td>
                  <td>
                    {invoice.gst_enabled ? (
                      <span className="admin-badge admin-badge-primary">GST</span>
                    ) : (
                      <span className="admin-badge admin-badge-warning">Non-GST</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-success">{invoice.status}</span>
                  </td>
                </tr>
              ))}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoices;
