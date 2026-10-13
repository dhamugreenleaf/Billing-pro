import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './AuthService';
import { loginSuccess, logout } from '../../redux/authSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';

const MSG91_SCRIPT_URL = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";

const AdminLogin = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const isVerifyingRef = useRef(false);
  const verifiedTokenRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);
  const mobileRef = useRef('');
  const initializedRef = useRef(false);
  
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

  // Initialize MSG91 widget once SDK is loaded
  useEffect(() => {
    if (sdkReady && !initializedRef.current) {
      initializedRef.current = true;
      window.configuration = {
        widgetId: import.meta.env.VITE_MSG91_WIDGET_ID || '',
        tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH || '',
        exposeMethods: true,
        captchaRenderId: 'msg91-admin-captcha-container',
        captchaVerified: (status) => {
          console.log("[MSG91] Admin Captcha verified callback:", status);
          setIsCaptchaVerified(!!status);
          setError('');
        },
        success: async (data) => {
          console.log("[MSG91] Admin Global Verification success");
          const accessToken = data?.message;
          if (!accessToken || isVerifyingRef.current || verifiedTokenRef.current === accessToken) {
            console.log("[MSG91] Duplicate or in-progress admin verification ignored");
            return;
          }
          isVerifyingRef.current = true;
          verifiedTokenRef.current = accessToken;

          try {
            const currentMobile = `91${mobileRef.current || mobile}`;
            const response = await AuthService.verifyMsg91Token(currentMobile, accessToken, 'admin');
            
            if (response.data.user.role === 'admin') {
              dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token
              }));
              navigate('/admin');
            } else {
              dispatch(logout());
              isVerifyingRef.current = false;
              verifiedTokenRef.current = null;
              setError('Unauthorized access. Admin privileges required.');
              setStep(1);
              setLoading(false);
            }
          } catch(err) {
            isVerifyingRef.current = false;
            verifiedTokenRef.current = null;
            setError(err.response?.data?.message || err.message || 'Server verification failed');
            setLoading(false);
          }
        },
        failure: (error) => {
          console.error("[MSG91] Admin Global Verification failed:", error?.message || 'Unknown error');
          setError(error?.message || 'OTP process failed');
          setLoading(false);
        }
      };

      if (window.initSendOTP) {
        try {
          window.initSendOTP(window.configuration);
          console.log("[MSG91] Admin widget initialized with captchaRenderId: msg91-admin-captcha-container");
        } catch (err) {
          console.error("[MSG91] Admin widget initialization error:", err);
        }
      }
    }
  }, [sdkReady, dispatch, navigate, mobile]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading) return; 
    
    let cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.slice(2);
    else if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = cleaned.slice(1);

    if (cleaned.length !== 10) {
      setError('Mobile number must be a valid 10-digit number');
      return;
    }
    
    if (cleaned !== mobile) {
      setMobile(cleaned);
      mobileRef.current = cleaned;
    } else {
      mobileRef.current = cleaned;
    }

    setError('');

    // Local Development Bypass
    if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log("[MSG91] Local dev bypass for OTP send");
      setLoading(true);
      setTimeout(() => {
        setStep(2);
        setResendTimer(60);
        setError('');
        setLoading(false);
      }, 500);
      return;
    }

    const widgetData = window.getWidgetData ? window.getWidgetData() : null;
    const requiresCaptcha = !!(widgetData?.captchaValidations);
    const captchaPassed = window.isCaptchaVerified ? window.isCaptchaVerified() : isCaptchaVerified;

    if (requiresCaptcha && !captchaPassed) {
      setError("Please complete the security check (CAPTCHA) above to continue.");
      return;
    }

    setLoading(true);
    console.log("[MSG91] Sending Admin OTP for:", cleaned);

    const normalizedMobile = `91${cleaned}`;

    if (window.sendOtp) {
      try {
        window.sendOtp(
          normalizedMobile,
          (data) => {
            console.log("[MSG91] Admin OTP send success callback. Request ID:", data?.reqId || data?.requestId || 'OK');
            setStep(2);
            setResendTimer(60);
            setError('');
            setLoading(false);
          },
          (err) => {
            console.error("[MSG91] Admin OTP send failed callback:", err?.message || 'Unknown error');
            setError(err?.message || "Failed to send OTP. Please try again.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("[MSG91] Admin sendOtp invocation error:", err);
        setError(err?.message || "Failed to send OTP. Please try again.");
        setLoading(false);
      }
    } else {
      setError("OTP service is still loading, please wait a moment.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    console.log("[MSG91] Resending Admin OTP");
    
    if (window.retryOtp) {
      try {
        window.retryOtp(
          11, // SMS channel
          (data) => {
            console.log("[MSG91] Admin OTP resend success. Request ID:", data?.reqId || data?.requestId || 'OK');
            setResendTimer(60);
            setError('');
            setLoading(false);
          },
          (err) => {
            console.error("[MSG91] Admin retryOtp failed callback:", err?.message);
            setError(err?.message || "Unable to resend OTP. Please try again.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("[MSG91] Admin retryOtp error:", err);
        setError(err?.message || "Unable to resend OTP. Please try again.");
        setLoading(false);
      }
    } else {
      setError("OTP service is not ready. Please refresh the page.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading || isVerifyingRef.current) return; 

    // Debounce rapid submits within 1200ms
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1200) {
      console.log("[MSG91] Submission debounced (< 1200ms)");
      return;
    }
    lastSubmitTimeRef.current = now;

    if (otp.length < 4) {
      setError('Invalid OTP. Please check the code and try again.');
      return;
    }

    // Local Development Bypass
    if (otp === '123456' && (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log("[MSG91] Local dev bypass for OTP 123456");
      if (window.configuration && window.configuration.success) {
        setLoading(true);
        window.configuration.success({ message: "mock_access_token_123456" });
      }
      return;
    }

    setError('');
    setLoading(true);
    console.log("[MSG91] Admin OTP verification started");

    if (window.verifyOtp) {
      try {
        window.verifyOtp(
          otp,
          (data) => {
            console.log("[MSG91] Admin OTP verification success callback");
            if (window.configuration && window.configuration.success) {
              window.configuration.success(data);
            }
          },
          (err) => {
            console.error("[MSG91] Admin OTP verification failed:", err?.message || 'Unknown error');
            if (err?.message?.toLowerCase().includes('already verified')) {
              console.log("[MSG91] Already verified, proceeding");
              return;
            }
            isVerifyingRef.current = false;
            verifiedTokenRef.current = null;
            setError(err?.message || "Invalid OTP. Please check the code and try again.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("[MSG91] Admin verifyOtp error:", err);
        setError("Verification error: " + err.message);
        setLoading(false);
      }
    } else {
      setError("MSG91 Widget not initialized");
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Secure access for administrators</p>
        </div>
        <form onSubmit={handleSendOtp}>
          <Input 
            type="tel"
            label="Mobile Number"
            placeholder="Enter admin mobile number"
            filterType="mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            error={error}
            autoFocus
          />
          <div id="msg91-admin-captcha-container" style={{ margin: '12px 0', minHeight: '30px' }}></div>
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
      </div>

      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <form onSubmit={handleVerifyOtp}>
          <p className="text-muted mb-4 text-green-600 font-medium">OTP sent successfully</p>
          <p className="text-muted mb-4">Please enter the code sent to {mobile}</p>
          <Input 
            type="text"
            label="Enter OTP"
            placeholder="Enter your OTP"
            filterType="numeric"
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 6) setOtp(val);
            }}
            error={error}
            autoFocus={step === 2}
          />
          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            disabled={loading || otp.length < 4}
            className="mt-4"
          >
            {loading ? 'Verifying OTP...' : 'Verify & Login'}
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
              isVerifyingRef.current = false;
              verifiedTokenRef.current = null;
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
      </div>
    </div>
  );
};

export default AdminLogin;
