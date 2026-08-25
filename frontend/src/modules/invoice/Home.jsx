import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/Button';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ todaySales: 0, todayInvoices: 0 });
  const [recentBills, setRecentBills] = useState([]);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, billsRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/invoices')
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (billsRes.data) {
          // just take top 3 for home
          setRecentBills(billsRes.data.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="mobile-wrapper" style={{ marginTop: 'var(--spacing-md)' }}>
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))', color: 'white' }}>
        <h3 style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>Good Morning, {user?.name || 'User'}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: 0 }}>Today's Sales</p>
            <h2 style={{ margin: 0 }}>₹{stats.todaySales}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: 0 }}>Bills</p>
            <h2 style={{ margin: 0 }}>{stats.todayInvoices}</h2>
          </div>
        </div>
      </div>

      <div className="flex-center" style={{ margin: 'var(--spacing-2xl) 0' }}>
        <Button 
          onClick={() => navigate('/invoice/new')}
          style={{ 
            borderRadius: 'var(--radius-full)', 
            padding: '1rem 2rem', 
            fontSize: 'var(--font-size-lg)',
            boxShadow: 'var(--shadow-floating)'
          }}
        >
          <Plus style={{ marginRight: '8px' }} />
          Generate Invoice
        </Button>
      </div>

      <div>
        <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ margin: 0 }}>Recent Bills</h3>
          <span 
            style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
            onClick={() => navigate('/bills')}
          >
            See All
          </span>
        </div>

        {recentBills.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
            No invoices yet. Create your first bill!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {recentBills.map(bill => (
              <div key={bill.id} className="card flex-between" style={{ padding: 'var(--spacing-md)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>{bill.invoice_number}</h4>
                  <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>{bill.description || 'Items'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ margin: 0 }}>₹{bill.total_amount}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
