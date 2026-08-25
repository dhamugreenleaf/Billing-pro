import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { Users, UserCheck, DollarSign, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, customersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/customers')
        ]);
        setStats(statsRes.data || null);
        const customersData = customersRes?.data || [];
        setRecentCustomers(customersData.slice(0, 5));
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-error)', textAlign: 'center', padding: '2rem' }}>{error}</div>;
  }

  // Mock data for charts
  const monthlyRevenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 59000 },
    { name: 'Jun', revenue: stats?.monthlyRevenue || 65000 },
  ];

  const customerDistribution = [
    { name: 'Paid Users', value: stats?.paidUsers || 25 },
    { name: 'Free Users', value: stats?.nonPaidUsers || 75 },
  ];
  
  const PIE_COLORS = ['#3b82f6', '#94a3b8'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 'bold' }}>Dashboard Overview</h1>
        <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Monitor SaaS metrics and user growth</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Card: Total Customers */}
        <StatCard 
          icon={<Users size={24} color="#3b82f6" />}
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle={`${stats?.customersToday || 0} activated today`}
          onClick={() => navigate('/admin/customers')}
        />

        {/* Card: Paid Customers */}
        <StatCard 
          icon={<UserCheck size={24} color="#10b981" />}
          title="Paid Customers"
          value={stats?.paidUsers || 0}
          subtitle="Premium tier users"
          onClick={() => navigate('/admin/customers?filter=paid')}
        />

        {/* Card: No Paid Customers */}
        <StatCard 
          icon={<Users size={24} color="#64748b" />}
          title="No Paid Customers"
          value={stats?.nonPaidUsers || 0}
          subtitle="Free tier users"
          onClick={() => navigate('/admin/customers?filter=free')}
        />

        {/* Card: Monthly Spend (Revenue) */}
        <StatCard 
          icon={<DollarSign size={24} color="#f59e0b" />}
          title="Monthly Revenue"
          value={`₹${(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Estimated subscription spend"
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.125rem' }}>Monthly Revenue Overview</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1px solid #f1f5f9',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>{title}</h3>
        <div style={{ 
          padding: '0.5rem', 
          backgroundColor: '#f8fafc', 
          borderRadius: '0.5rem' 
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a' }}>
        {value}
      </div>
      
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
