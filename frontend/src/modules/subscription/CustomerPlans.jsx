import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const CustomerPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData();
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current')
      ]);
      setPlans(plansRes.data || []);
      setCurrentSub(subRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = (plan) => {
    if (plan.price === 0 || plan.price === '0.00') {
      alert('You are already on the Free plan by default or cannot explicitly purchase it.');
      return;
    }
    
    // Check if upgrading to same plan
    if (currentSub?.Plan?.id === plan.id && currentSub?.status === 'active') {
      alert('You are already subscribed to this plan.');
      return;
    }

    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const confirmSubscription = async () => {
    setModalOpen(false);
    if (!selectedPlan) return;
    
    const plan = selectedPlan;
    setProcessingId(plan.id);

    try {
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setProcessingId(null);
        return;
      }

      // Create order
      const orderRes = await api.post('/subscription/create-order', { planId: plan.id });
      if (!orderRes.success) {
        alert(orderRes.message || 'Failed to create order');
        setProcessingId(null);
        return;
      }

      const options = {
        key: orderRes.data.key_id,
        amount: orderRes.data.amount, // may be undefined for subscriptions, which is fine
        currency: orderRes.data.currency || 'INR',
        name: 'Billing Pro',
        description: `Subscription to ${plan.name} Plan`,
        ...(orderRes.data.subscription_id ? { subscription_id: orderRes.data.subscription_id } : { order_id: orderRes.data.order_id }),
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await api.post('/subscription/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            });

            if (verifyRes.success) {
              alert('Payment Successful! ' + (verifyRes.message || 'Subscription activated.'));
              fetchData();
            } else {
              alert(verifyRes.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.message || 'Payment verification failed');
          } finally {
            setProcessingId(null);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile_number || ''
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setProcessingId(null);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to process subscription');
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading plans...</div>;
  }

  const currentPlanId = currentSub?.Plan?.id;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
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
        .plan-card-current {
          border: 2px solid #3b82f6 !important;
          box-shadow: 0 12px 24px -8px rgba(59, 130, 246, 0.25), 0 4px 12px -3px rgba(59, 130, 246, 0.15) !important;
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
        .plan-card-premium:hover::before, .plan-card-current::before {
          opacity: 1;
        }
        .plan-btn {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .plan-btn-primary {
          background-color: #3b82f6;
          color: white;
        }
        .plan-btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }
        .plan-btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        .plan-btn-current {
          background-color: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }
      `}</style>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.025em' }}>Subscription Plans</h1>
        <p className="text-muted" style={{ margin: '0.375rem 0 0 0', fontSize: '0.95rem' }}>Upgrade your plan to unlock premium features and formats.</p>
      </div>

      {currentSub && (
        <div style={{ marginBottom: '3rem', padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#166534' }}>Your Current Plan: {currentSub.Plan?.name}</h2>
          <p style={{ margin: 0, color: '#15803d' }}>
            {currentSub.isImplicit 
              ? 'You are currently on the default free tier.' 
              : `Your subscription is active until ${currentSub.end_date ? new Date(currentSub.end_date).toLocaleDateString() : 'Forever'}.`}
          </p>
        </div>
      )}

      {plans.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>No subscription plans are currently available.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            return (
              <div key={plan.id} className={`plan-card-premium ${isCurrent ? 'plan-card-current' : ''}`}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: 0, right: '24px', backgroundColor: '#3b82f6', color: 'white', padding: '4px 12px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    CURRENT PLAN
                  </div>
                )}
                
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>{plan.name}</h3>
                
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>₹{Number(plan.price)}</span>
                  {Number(plan.price) > 0 && <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500', marginLeft: '4px' }}>/{plan.billing_cycle === 'forever' ? 'forever' : plan.billing_cycle === 'monthly' ? 'month' : 'year'}</span>}
                </div>

                <div style={{ flex: 1, marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{plan.description}</p>
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

                <button 
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={isCurrent || processingId === plan.id}
                  className={`plan-btn ${isCurrent ? 'plan-btn-current' : 'plan-btn-primary'}`}
                >
                  {processingId === plan.id ? 'Processing...' : isCurrent ? 'Active Plan' : `Subscribe to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'modalFadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
                <AlertCircle size={32} />
              </div>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
              Confirm Subscription
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.95rem', textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to subscribe to the <strong style={{ color: '#0f172a' }}>{selectedPlan.name}</strong> plan for <strong style={{ color: '#0f172a' }}>₹{Number(selectedPlan.price)}</strong>?
            </p>
            {selectedPlan.billing_cycle === 'monthly' || selectedPlan.billing_cycle === 'yearly' ? (
              <p style={{ margin: '0 0 2rem 0', color: '#0f172a', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <strong>Your subscription renews automatically every {selectedPlan.billing_cycle === 'monthly' ? 'month' : 'year'}.</strong><br/>
                ₹{Number(selectedPlan.price)} is charged now. AutoPay is authorized. ₹{Number(selectedPlan.price)} will be automatically charged every {selectedPlan.billing_cycle === 'monthly' ? 'month' : 'year'}.
              </p>
            ) : (
              <div style={{ marginBottom: '2rem' }}></div>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmSubscription}
                style={{ flex: 1, padding: '0.75rem', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPlans;
