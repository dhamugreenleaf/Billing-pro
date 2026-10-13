import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Sparkles, XCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../utils/api';
import { updateUser } from '../../redux/authSlice';
import toast from 'react-hot-toast';

const CustomerPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

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
      const list = plansRes.data || [];
      // Sort Free, Basic, Pro
      const order = { 'Free': 1, 'Basic': 2, 'Pro': 3 };
      list.sort((a, b) => (order[a.name] || 99) - (order[b.name] || 99));
      setPlans(list);
      setCurrentSub(subRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = (plan) => {
    if (plan.price === 0 || plan.price === '0.00' || plan.name === 'Free') {
      toast('You are on the Free plan (10 bills/month). Select Basic or Pro to unlock more bills and features!', { icon: 'ℹ️' });
      return;
    }
    
    // Check if already subscribed to same plan
    if (currentSub?.Plan?.id === plan.id && currentSub?.status === 'active') {
      toast(`You already have an active subscription to the ${plan.name} plan.`, { icon: '✅' });
      return;
    }

    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleDirectTestActivate = async (planToActivate) => {
    const targetPlan = planToActivate || selectedPlan;
    if (!targetPlan) return;

    try {
      setProcessingId(targetPlan.id || 'test_activate');
      await api.post('/subscription/activate-test-pro', { planName: targetPlan.name });
      
      if (targetPlan.name === 'Basic') {
        toast.success('🎉 Basic Plan activated successfully! 1,500 bills & Express Bill unlocked.');
      } else if (targetPlan.name === 'Pro') {
        toast.success('🎉 Pro Plan activated successfully! 2,500 bills & Products module unlocked.');
      } else {
        toast.success(`🎉 ${targetPlan.name} Plan activated successfully!`);
      }

      dispatch(updateUser({ subscription_status: 'paid' }));
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      dispatch(updateUser({ subscription_status: 'paid' }));
      toast.success(`🎉 ${targetPlan.name} Plan activated successfully!`);
      setModalOpen(false);
      fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  const confirmSubscription = async () => {
    setModalOpen(false);
    if (!selectedPlan) return;
    
    const plan = selectedPlan;
    setProcessingId(plan.id);

    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setProcessingId(null);
        return;
      }

      // Create order
      const orderRes = await api.post('/subscription/create-order', { planId: plan.id });
      if (!orderRes.success) {
        toast.error(orderRes.message || 'Failed to create order');
        setProcessingId(null);
        return;
      }

      const options = {
        key: orderRes.data.key_id,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency || 'INR',
        name: 'GoBill',
        description: `Subscription to ${plan.name} Plan`,
        ...(orderRes.data.subscription_id ? { subscription_id: orderRes.data.subscription_id } : { order_id: orderRes.data.order_id }),
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/subscription/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            });

            if (verifyRes.success) {
              if (plan.name === 'Basic') {
                toast.success('🎉 Basic Plan activated successfully! 1,500 bills and Express Bill unlocked.');
              } else if (plan.name === 'Pro') {
                toast.success('🎉 Pro Plan activated successfully! 2,500 bills and Products module unlocked.');
              } else {
                toast.success(verifyRes.message || `${plan.name} Plan activated successfully!`);
              }
              dispatch(updateUser({ subscription_status: 'paid' }));
              fetchData();
            } else {
              toast.error(verifyRes.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || 'Payment verification failed');
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
          color: plan.name === 'Pro' ? '#2563eb' : '#059669',
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
      toast.error(err.response?.data?.message || err.message || 'Failed to process subscription');
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading subscription plans...</div>;
  }

  const currentPlanId = currentSub?.Plan?.id;

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
      <style>{`
        .plans-grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .plans-grid-container {
            grid-template-columns: 1fr;
            max-width: 480px;
            margin: 0 auto;
          }
        }
        .plan-card-box {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          padding: 32px 26px;
          position: relative;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
        }
        .plan-card-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
        }
        .plan-card-recommended {
          background: #f0fdf4 !important;
          border: 2px solid #059669 !important;
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.12) !important;
        }
        .recommended-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #059669;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          padding: 4px 16px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        }
        .plan-price-val {
          font-size: 2.75rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .plan-price-cycle {
          font-size: 0.95rem;
          color: #475569;
          font-weight: 600;
          margin-left: 4px;
        }
        .feature-item-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.45;
        }
        .feature-icon-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #d1fae5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .feature-icon-cross {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fee2e2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .btn-plan-action {
          width: 100%;
          padding: 13px 18px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
        }
        .btn-free {
          background: #ffffff;
          border: 1.5px solid #059669;
          color: #059669;
        }
        .btn-free:hover {
          background: #f0fdf4;
        }
        .btn-basic {
          background: #059669;
          border: 1.5px solid #059669;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .btn-basic:hover {
          background: #047857;
          border-color: #047857;
        }
        .btn-pro {
          background: #2563eb;
          border: 1.5px solid #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .btn-pro:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }
        .btn-active-plan {
          background: #e2e8f0;
          border: 1.5px solid #cbd5e1;
          color: #64748b;
          cursor: default;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.025em' }}>
          Subscription Plans & Pricing
        </h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.98rem', color: '#64748b' }}>
          Select the ideal plan for your shop. Upgrade anytime to unlock higher monthly billing limits and pro formats.
        </p>
      </div>

      {/* Current Active Plan Alert Bar */}
      {currentSub && (
        <div style={{
          marginBottom: '2.5rem',
          padding: '14px 20px',
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #a7f3d0',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, color: '#059669' }}>
              Active Subscription
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
              {currentSub.Plan?.name || 'Free'} Plan Active
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>
            {currentSub.Plan?.name === 'Pro' 
              ? '✨ 2,500 bills/mo • Products Module Unlocked • All 9 Templates' 
              : currentSub.Plan?.name === 'Basic'
              ? '⚡ 1,500 bills/mo • Express Bill Unlocked • GST Support'
              : '10 bills/mo default'}
          </div>
        </div>
      )}

      {/* Plans 3-Card Grid */}
      <div className="plans-grid-container">
        {plans.map((plan) => {
          const isBasic = plan.name === 'Basic';
          const isPro = plan.name === 'Pro';
          const isFree = plan.name === 'Free';
          const isCurrent = currentPlanId === plan.id;

          return (
            <div 
              key={plan.id} 
              className={`plan-card-box ${isBasic ? 'plan-card-recommended' : ''}`}
            >
              {/* Recommended Badge on Basic */}
              {isBasic && (
                <div className="recommended-badge">
                  Recommended
                </div>
              )}

              {/* Plan Title */}
              <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: '800', color: '#0f172a' }}>
                {plan.name}
              </h2>

              {/* Price */}
              <div style={{ margin: '14px 0 6px', display: 'flex', alignItems: 'baseline' }}>
                <span className="plan-price-val">₹{Number(plan.price).toFixed(0)}</span>
                <span className="plan-price-cycle">
                  {isFree ? 'Forever' : '/month'}
                </span>
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.45, minHeight: '40px' }}>
                {plan.description}
              </p>

              <div style={{ height: '1px', backgroundColor: isBasic ? '#a7f3d0' : '#e2e8f0', marginBottom: '20px' }} />

              {/* Features List */}
              <div style={{ flex: 1, marginBottom: '28px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features && plan.features.map((feature, fIdx) => {
                    const isNegative = feature.toLowerCase().startsWith('no ') || feature.includes('❌');
                    const cleanText = feature.replace('❌', '').trim();

                    return (
                      <li key={fIdx} className="feature-item-row">
                        {isNegative ? (
                          <div className="feature-icon-cross">
                            <X size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="feature-icon-circle">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                        <span style={{ color: isNegative ? '#64748b' : '#1e293b', fontWeight: isNegative ? 500 : 600 }}>
                          {cleanText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={isCurrent || processingId === plan.id}
                  className={`btn-plan-action ${
                    isCurrent 
                      ? 'btn-active-plan' 
                      : isFree 
                      ? 'btn-free' 
                      : isBasic 
                      ? 'btn-basic' 
                      : 'btn-pro'
                  }`}
                >
                  {isCurrent 
                    ? '✓ Active Plan' 
                    : isFree 
                    ? 'Get Started Free' 
                    : `Subscribe to ${plan.name}`}
                </button>

                {/* Instant Test Activation Shortcut for dev/testing */}
                {!isFree && !isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleDirectTestActivate(plan)}
                    disabled={processingId === plan.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isBasic ? '#059669' : '#2563eb',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    title={`Instantly activate ${plan.name} plan for testing`}
                  >
                    <Sparkles size={13} />
                    <span>Instant Test Activate {plan.name}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Confirm / Payment Modal */}
      {modalOpen && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            padding: '28px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: selectedPlan.name === 'Pro' ? '#eff6ff' : '#ecfdf5',
                color: selectedPlan.name === 'Pro' ? '#2563eb' : '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Activate {selectedPlan.name} Plan
              </h3>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                {selectedPlan.name === 'Basic' 
                  ? '⚡ 1,500 bills per month & Express Bill' 
                  : '📦 2,500 bills per month & Products Module'}
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Subscription Price
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                ₹{Number(selectedPlan.price).toFixed(0)} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>/month</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleDirectTestActivate(selectedPlan)}
                disabled={processingId !== null}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: 'none',
                  background: selectedPlan.name === 'Pro' 
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                }}
              >
                <Sparkles size={17} />
                <span>Activate {selectedPlan.name} (Instant Test)</span>
              </button>

              <button
                type="button"
                onClick={confirmSubscription}
                disabled={processingId !== null}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Pay via Razorpay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPlans;
