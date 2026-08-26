import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { ArrowLeft, User, Building, FileText, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';

const AdminCustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/admin/customers/${id}`);
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const executeToggleStatus = async () => {
    setShowConfirm(false);
    setUpdating(true);
    try {
      const response = await api.put(`/admin/customers/${id}/status`, {
        is_active: !data.user.is_active
      });
      setData(prev => ({
        ...prev,
        user: { ...prev.user, is_active: !prev.user.is_active }
      }));
      toast.success(response.message || 'Customer status updated');
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const toggleStatus = () => {
    if (!data?.user) return;
    setShowConfirm(true);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Customer not found</div>;

  const { user, company } = data;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/admin/customers')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={20} /> Back to Customers
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1e293b' }}>{user.name || 'Unknown User'}</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Registered on {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        
        <button 
          onClick={toggleStatus}
          disabled={updating}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: user.is_active ? '#fee2e2' : '#dcfce7', 
            color: user.is_active ? '#991b1b' : '#166534',
            border: 'none', 
            borderRadius: '0.25rem',
            cursor: updating ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {user.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {user.is_active ? 'Deactivate Account' : 'Activate Account'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#3b82f6" /> User Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div><strong>Mobile:</strong> {user.mobile_number}</div>
            <div><strong>Email:</strong> {user.email || 'Not provided'}</div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`admin-badge ${user.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <strong>SaaS Plan:</strong>{' '}
              <span className={`admin-badge ${user.subscription_status === 'paid' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                {user.subscription_status === 'paid' ? 'Paid' : user.subscription_status === 'expired' ? 'Expired' : 'Free Version'}
              </span>
            </div>
          </div>
        </div>

        {/* Company Card */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="#8b5cf6" /> Company Details
          </h3>
          {company ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div><strong>Company Name:</strong> {company.company_name}</div>
              <div><strong>Owner:</strong> {company.owner_name || 'Not provided'}</div>
              <div><strong>Address:</strong> {company.address || 'Not provided'}</div>
              <div><strong>GSTIN:</strong> {company.gst_number || 'Not Registered'}</div>
            </div>
          ) : (
            <div className="text-muted">Company not set up yet.</div>
          )}
        </div>


      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeToggleStatus}
        title={`${user?.is_active ? 'Deactivate' : 'Activate'} Customer`}
        message={`Are you sure you want to ${user?.is_active ? 'deactivate' : 'activate'} this customer?`}
        confirmText={user?.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
        isDestructive={user?.is_active}
      />
    </div>
  );
};

export default AdminCustomerDetails;
