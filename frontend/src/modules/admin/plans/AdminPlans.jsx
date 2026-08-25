import React, { useState, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import api from '../../../utils/api';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billing_cycle: 'monthly',
    description: '',
    features: '',
    status: 'active'
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscription/plans');
      setPlans(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: '',
      billing_cycle: 'monthly',
      description: '',
      features: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      description: plan.description || '',
      features: plan.features ? plan.features.join('\n') : '',
      status: plan.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        await api.put(`/subscription/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/subscription/plans', payload);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save plan');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/subscription/plans/${id}/status`, { status: newStatus });
      fetchPlans();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <style>{`
        .plan-card-premium {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }
        .plan-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1), 0 4px 12px -3px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .plan-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .plan-card-premium:hover::before {
          opacity: 1;
        }
        .plan-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .plan-btn-edit {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .plan-btn-edit:hover {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        .plan-btn-deactivate {
          background-color: #fef2f2;
          color: #dc2626;
        }
        .plan-btn-deactivate:hover {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        .plan-btn-activate {
          background-color: #f0fdf4;
          color: #16a34a;
        }
        .plan-btn-activate:hover {
          background-color: #dcfce7;
          color: #15803d;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.025em' }}>Subscription Plans</h1>
          <p className="text-muted" style={{ margin: '0.375rem 0 0 0', fontSize: '0.95rem' }}>Manage SaaS tiers and pricing limits</p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', padding: '10px 20px', fontSize: '0.95rem' }}>
          <Plus size={18} /> Create Plan
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading plans...</div>
      ) : plans.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>No plans found. Create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card-premium" style={{ opacity: plan.status === 'active' ? 1 : 0.65 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>{plan.name}</h3>
                <span className={`admin-badge ${plan.status === 'active' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                  {plan.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>₹{Number(plan.price)}</span>
                <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500', marginLeft: '4px' }}>/{plan.billing_cycle === 'forever' ? 'forever' : plan.billing_cycle === 'monthly' ? 'month' : 'year'}</span>
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', marginBottom: '1rem', color: '#334155', fontSize: '0.95rem' }}>Includes:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {plan.features && plan.features.map((feature, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                      <div style={{ marginTop: '2px', backgroundColor: '#e0e7ff', borderRadius: '50%', padding: '2px' }}>
                        <Check size={14} color="#4f46e5" strokeWidth={3} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button 
                  className="plan-btn plan-btn-edit"
                  onClick={() => openEditModal(plan)}
                >
                  Edit Plan
                </button>
                <button 
                  className={`plan-btn ${plan.status === 'active' ? 'plan-btn-deactivate' : 'plan-btn-activate'}`}
                  onClick={() => toggleStatus(plan.id, plan.status)}
                >
                  {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="admin-form-label">Plan Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="admin-form-control" placeholder="e.g. Pro Plan" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <label className="admin-form-label">Price (₹)</label>
                  <input type="number" min="0" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="admin-form-control" placeholder="0" />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label className="admin-form-label">Billing Cycle</label>
                  <select value={formData.billing_cycle} onChange={e => setFormData({...formData, billing_cycle: e.target.value})} className="admin-form-control">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="admin-form-label">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="admin-form-control" placeholder="Brief description of the plan" />
              </div>

              <div>
                <label className="admin-form-label">Features (One per line)</label>
                <textarea rows="4" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="admin-form-control" placeholder="10 Bills/month&#10;Basic Invoicing" style={{ height: 'auto', minHeight: '100px', resize: 'vertical' }}></textarea>
              </div>

              <div>
                <label className="admin-form-label">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="admin-form-control">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="admin-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}>
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
