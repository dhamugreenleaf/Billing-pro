import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User } from 'lucide-react';
import api from '../../../utils/api';
import { updateUser } from '../../../redux/authSlice';

const AdminSettings = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user?.name || 'Super Admin',
    mobile_number: user?.mobile_number || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const res = await api.put('/admin/profile', formData);
      if (res.data.success) {
        alert('Profile updated successfully');
        dispatch(updateUser(res.data.data));
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Admin Settings</h1>
        <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Manage your admin profile and system preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#3b82f6" /> Profile Details
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Admin Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{ padding: '0.5rem', width: '100%', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Admin Phone (Login ID)</label>
              <input 
                type="text" 
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                style={{ padding: '0.5rem', width: '100%', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }} 
              />
            </div>
            <button 
              onClick={handleUpdateProfile}
              disabled={loading}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: loading ? '#94a3b8' : '#3b82f6', 
                color: 'white',
                border: 'none', 
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
