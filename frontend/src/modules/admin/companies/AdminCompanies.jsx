import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/admin/companies');
        setCompanies(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.gst_number && c.gst_number.includes(searchTerm))
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Companies</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Manage all registered businesses</p>
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Search company, phone, GST..."
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
                <th>Owner Details</th>
                <th>Location</th>
                <th>GSTIN</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : filteredCompanies.map(company => (
                <tr key={company.id}>
                  <td style={{ fontWeight: '500' }}>{company.company_name}</td>
                  <td>
                    <div>{company.owner_name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{company.phone}</div>
                  </td>
                  <td>{company.city ? `${company.city}, ${company.state}` : 'N/A'}</td>
                  <td>
                    {company.gst_number ? (
                      <span className="admin-badge admin-badge-success">{company.gst_number}</span>
                    ) : (
                      <span className="admin-badge admin-badge-warning">Unregistered</span>
                    )}
                  </td>
                  <td>{new Date(company.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/admin/customers/${company.user_id}`)}
                      style={{ 
                        padding: '0.35rem 0.75rem', 
                        backgroundColor: '#f1f5f9', 
                        border: 'none', 
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      View Owner
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No companies found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCompanies;
