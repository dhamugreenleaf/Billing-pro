import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../utils/api';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter'); // 'paid' or 'free'
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/admin/customers');
      setCustomers(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    // URL Filter (Paid vs Free)
    if (filterType === 'paid' && c.subscription_status !== 'paid') return false;
    if (filterType === 'free' && c.subscription_status === 'paid') return false;
    
    // Text search filter
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = c.name ? String(c.name).toLowerCase().includes(searchLower) : false;
    const companyMatch = c.company_name ? String(c.company_name).toLowerCase().includes(searchLower) : false;
    const ownerMatch = c.owner_name ? String(c.owner_name).toLowerCase().includes(searchLower) : false;
    const mobileMatch = c.mobile_number ? String(c.mobile_number).includes(searchTerm) : false;
    
    return nameMatch || companyMatch || ownerMatch || mobileMatch;
  });

  const toggleCustomerStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/customers/${id}/status`, { is_active: !currentStatus });
      setCustomers(customers.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update customer status');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will disable their access.')) return;
    try {
      await api.delete(`/admin/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete customer', err);
      alert('Failed to delete customer');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Customers</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Manage all registered customer accounts</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search name or mobile..."
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
                <th>Company Name</th>
                <th>Person Name</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Reg. Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td style={{ fontWeight: '500', color: '#0f172a' }}>{customer.company_name || 'N/A'}</td>
                  <td style={{ fontWeight: '500', color: '#475569' }}>{customer.owner_name || customer.name || 'N/A'}</td>
                  <td>{customer.mobile_number}</td>
                  <td>
                    <span className={`admin-badge ${customer.subscription_status === 'paid' ? 'admin-badge-success' : customer.subscription_status === 'expired' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                      {customer.plan}
                    </span>
                  </td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleCustomerStatus(customer.id, customer.is_active)}
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          backgroundColor: customer.is_active ? '#ef4444' : '#10b981', 
                          color: 'white',
                          border: 'none', 
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        {customer.is_active ? 'Set Inactive' : 'Set Active'}
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          backgroundColor: '#f87171', 
                          color: 'white',
                          border: 'none', 
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminCustomers;
