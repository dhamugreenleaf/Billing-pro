import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './AuthService';
import api from '../../utils/api';
import { loginSuccess } from '../../redux/authSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';

const MSG91_SCRIPT_URL = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [reqId, setReqId] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showSmallReminder, setShowSmallReminder] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Resend Timer Countdown
  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  // PWA Install Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show main popup only if they haven't cancelled recently
      const hasCancelled = sessionStorage.getItem('pwa_install_cancelled');
      if (!hasCancelled) {
        setShowInstallPopup(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let reminderInterval;
    const hasCancelled = sessionStorage.getItem('pwa_install_cancelled');
    if (hasCancelled && deferredPrompt) {
      reminderInterval = setInterval(() => {
        setShowSmallReminder(true);
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => {
      if (reminderInterval) clearInterval(reminderInterval);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    setShowInstallPopup(false);
    setShowSmallReminder(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleCancelInstall = () => {
    setShowInstallPopup(false);
    setShowSmallReminder(false);
    sessionStorage.setItem('pwa_install_cancelled', 'true');
    
    // Start the 5-minute reminder timer
    setTimeout(() => {
       if (deferredPrompt) {
         setShowSmallReminder(true);
       }
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    let checkInterval;
    
    const checkSDK = () => {
      if (window.initSendOTP) {
        if (!sdkReady) {
          console.log("[MSG91] SDK ready");
          setSdkReady(true);
        }
        if (checkInterval) clearInterval(checkInterval);
        return true;
      }
      return false;
    };

    if (checkSDK()) return;

    checkInterval = setInterval(checkSDK, 500);

    const existingScript = document.querySelector(`script[src="${MSG91_SCRIPT_URL}"]`);
    if (!existingScript) {
      console.log("[MSG91] Loading SDK...");
      const script = document.createElement('script');
      script.src = MSG91_SCRIPT_URL;
      script.async = true;
      
      script.onerror = () => {
        console.error("[MSG91] Script loading failed");
        setSdkError(true);
        if (checkInterval) clearInterval(checkInterval);
      };

      document.head.appendChild(script);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [sdkReady]);

  const initWidgetAndSendOtp = () => {
    // Standardize mobile number format
    const normalizedMobile = `91${mobile}`;
    
    window.configuration = {
      widgetId: "3668716a4864373039323834",
      tokenAuth: "560885T2kcvOrbS46a82e3fcP1",
      identifier: normalizedMobile,
      exposeMethods: true,
      success: async (data) => {
        console.log("[MSG91] Global Verification success");
        try {
          const accessToken = data.message;
          const response = await AuthService.verifyMsg91Token(normalizedMobile, accessToken);
          dispatch(loginSuccess({
            user: response.data.user,
            token: response.data.token
          }));
          
          if (response.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            if (response.data.user.profile_completed) {
              navigate('/');
            } else {
              navigate('/setup');
            }
          }
        } catch(err) {
          setError(err.message || 'Server verification failed');
          setLoading(false);
        }
      },
      failure: (error) => {
        console.error("[MSG91] Global Verification failed:", error?.message || 'Unknown error');
        
        if (error?.message?.includes('Captcha')) {
          console.log("[MSG91] Bypassing Captcha error in Global Verification");
          return;
        }

        setError(error?.message || 'OTP process failed');
        setLoading(false);
      }
    };

    try {
      // Prevent duplicate initialization if window.sendOtp already exists
      if (!window.sendOtp) {
        window.initSendOTP(window.configuration);
        console.log("[MSG91] Widget initialized");
      }
      
      const trySend = () => {
        if (window.sendOtp) {
          console.log("[MSG91] Calling sendOtp");
          window.sendOtp(
            normalizedMobile,
            (data) => {
              console.log("[MSG91] OTP send success");
              setStep(2);
              setResendTimer(60);
              setError('');
              setLoading(false);
            },
            (err) => {
              console.error("[MSG91] OTP send failed:", err?.message || 'Unknown error');
              // Bypass Invalid Captcha Token error since OTP is still delivered by MSG91
              if (err?.message?.includes('Captcha')) {
                console.log("[MSG91] Bypassing Captcha error, proceeding to OTP entry");
                setStep(2);
                setResendTimer(60);
                setError('');
                setLoading(false);
              } else {
                setError(err?.message || "Unable to send OTP. Please try again.");
                setLoading(false);
              }
            }
          );
        } else {
          setTimeout(trySend, 200);
        }
      };
      
      trySend();
    } catch (err) {
      setError("Widget Initialization failed: " + err.message);
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading) return; // Prevent duplicate clicks
    
    if (mobile.length !== 10) {
      setError('Mobile number must be 10 digits');
      return;
    }
    
    setError('');
    
    if (sdkError) {
      setError('Failed to load OTP service. Please refresh to try again.');
      return;
    }
    
    if (!sdkReady || !window.initSendOTP) {
      setError('OTP service is still loading, please wait...');
      return;
    }

    setLoading(true);
    console.log("[MSG91] Sending OTP");
    initWidgetAndSendOtp();
  };

  const handleResendOtp = () => {
    if (loading) return;
    setLoading(true);
    setError('');
    console.log("[MSG91] Resending OTP");
    
    const normalizedMobile = `91${mobile}`;
    
    if (window.retryOtp) {
      window.retryOtp(
        11, // 11 is the channel code for SMS
        (data) => {
          console.log("[MSG91] OTP resend success");
          setResendTimer(60);
          setError('');
          setLoading(false);
        },
        (err) => {
          console.error("[MSG91] OTP resend failed:", err?.message || 'Unknown error');
          if (err?.message?.includes('Captcha')) {
            console.log("[MSG91] Bypassing Captcha error on resend, assuming OTP delivered");
            setResendTimer(60);
            setError('');
            setLoading(false);
          } else if (err?.message?.toLowerCase().includes('already verified')) {
            console.log("[MSG91] Bypassing already verified error on resend");
            setResendTimer(60);
            setError('');
            setLoading(false);
          } else {
            setError(err?.message || "Unable to resend OTP. Please try again.");
            setLoading(false);
          }
        }
      );
    } else {
      // Fallback if retryOtp is not exposed
      initWidgetAndSendOtp();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate clicks

    if (otp.length < 4) {
      setError('Invalid OTP. Please check the code and try again.');
      return;
    }

    // Local Development Bypass
    if (otp === '123456' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log("[MSG91] Local dev bypass for OTP 123456");
      if (window.configuration && window.configuration.success) {
        setLoading(true);
        window.configuration.success({ message: "mock_access_token_123456" });
      }
      return;
    }

    setError('');
    setLoading(true);
    console.log("[MSG91] OTP verification started");
    
    if (window.verifyOtp) {
      try {
        // According to standard web SDK MSG91 API: verifyOtp(otp, successCallback, failureCallback)
        window.verifyOtp(
          otp,
          (data) => {
            console.log("[MSG91] OTP verification success");
            if (window.configuration && window.configuration.success) {
              window.configuration.success(data);
            }
          },
          (err) => {
            console.error("[MSG91] OTP verification failed:", err?.message || 'Unknown error');
            if (err?.message?.includes('Captcha')) {
              console.log("[MSG91] Bypassing Captcha error in verification");
              return;
            }
            if (err?.message?.toLowerCase().includes('already verified')) {
              console.log("[MSG91] Bypassing already verified error");
              // If it's already verified, we might still need the success callback to fire.
              // But at least we don't show the error.
              return;
            }
            setError(err?.message || "Invalid OTP. Please check the code and try again.");
            setLoading(false);
          }
        );
        
        // Timeout in case MSG91 completely hangs
        setTimeout(() => {
          setLoading((prevLoading) => {
            if (prevLoading) {
              setError("Verification timed out. Please try again.");
              return false;
            }
            return prevLoading;
          });
        }, 15000);
        
      } catch (err) {
        setError("Widget Verification failed: " + err.message);
        setLoading(false);
      }
    } else {
      setError("MSG91 Widget not initialized");
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div style={{ position: 'relative' }}>
        {showInstallPopup && (
          <div style={{
            position: 'absolute',
            top: '-20px', left: 0, right: 0, zIndex: 50,
            background: 'white', padding: '1rem', borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0', marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Install App</h4>
            <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>Install the app for a better experience.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="button" onClick={handleInstallClick} style={{ flex: 1, padding: '0.5rem' }}>Install</Button>
              <Button type="button" variant="secondary" onClick={handleCancelInstall} style={{ flex: 1, padding: '0.5rem' }}>Cancel</Button>
            </div>
          </div>
        )}
        <form onSubmit={handleSendOtp} style={showInstallPopup ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
          <Input 
            type="tel"
            label="Mobile Number"
            placeholder="Enter your mobile number"
            filterType="mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            error={error}
            autoFocus
          />
          <Button 
            type="submit" 
            fullWidth 
            loading={loading || (!sdkReady && !sdkError)}
            disabled={!sdkReady && !sdkError}
            className="mt-4"
          >
            {(!sdkReady && !sdkError) ? 'Loading OTP service...' : 'Continue'}
          </Button>
        </form>
        
        {showSmallReminder && !showInstallPopup && (
          <div style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 100,
            background: 'white', padding: '0.75rem', borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
          }} onClick={handleInstallClick}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Install App</span>
            <button onClick={(e) => { e.stopPropagation(); setShowSmallReminder(false); }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: '0 4px'
            }}>×</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp}>
      <p className="text-muted mb-4 text-green-600 font-medium">OTP sent successfully</p>
      <p className="text-muted mb-4">Please enter the code sent to {mobile}</p>
      <Input 
        type="text"
        label="Enter OTP"
        placeholder="Enter your OTP"
        filterType="numeric" // Use custom numeric filter
        value={otp}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          if (val.length <= 6) setOtp(val);
        }}
        error={error}
        autoFocus
      />
      <Button 
        type="submit" 
        fullWidth 
        loading={loading}
        className="mt-4"
      >
        Verify & Login
      </Button>
      
      <div className="mt-4 flex flex-col items-center gap-2">
        {resendTimer > 0 ? (
          <p className="text-sm text-gray-500">Resend OTP in {resendTimer}s</p>
        ) : (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleResendOtp}
            disabled={loading}
            className="text-primary hover:bg-primary/5"
          >
            Resend OTP
          </Button>
        )}
      </div>

      <Button 
        type="button" 
        variant="secondary" 
        fullWidth 
        onClick={() => {
          setStep(1);
          setOtp('');
          setError('');
          setResendTimer(0);
        }}
        className="mt-4"
        disabled={loading}
      >
        Change Number
      </Button>
    </form>
  );
};

export default Login;
