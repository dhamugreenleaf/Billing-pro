import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/admin/reports/individual');
        setReports(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    return (r.name && r.name.toLowerCase().includes(searchLower)) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchLower)) ||
      (r.owner_name && r.owner_name.toLowerCase().includes(searchLower)) ||
      (r.mobile_number && r.mobile_number.includes(searchTerm));
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Individual Reports</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Analyze usage metrics per individual customer</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          <select style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Person Name</th>
                <th>Mobile Number</th>
                <th>Plan Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : filteredReports.map(report => (
                <tr key={report.id}>
                  <td style={{ fontWeight: '500', color: '#0f172a' }}>{report.company_name || 'N/A'}</td>
                  <td style={{ fontWeight: '500', color: '#475569' }}>{report.owner_name || report.name || 'N/A'}</td>
                  <td>{report.mobile_number}</td>
                  <td>
                    <span className={`admin-badge ${report.subscription_status === 'paid' ? 'admin-badge-success' : report.subscription_status === 'expired' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                      {report.plan}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filteredReports.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
