import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, Share } from 'lucide-react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosTooltip, setShowIosTooltip] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // Check if it is already installed (standalone mode)
    const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(_isStandalone);
    
    if (_isStandalone) {
      return; // If already installed, do nothing
    }

    // Check last dismissed time (2 minutes cooldown)
    const lastDismissed = localStorage.getItem('pwaPromptDismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 120000) {
      return; 
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const _isIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(_isIOS);

    if (_isIOS && !_isStandalone) {
      // Show iOS prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Handle beforeinstallprompt for Android/Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // When successfully installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  const isLoginPage = location.pathname === '/login';

  if (!isLoginPage) {
    // Do not show intrusive floating circular button over dashboard and mobile tools
    return null;
  }

  // Neat, small banner style
  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13px',
        color: '#334155'
      }}>
        {isIOS ? (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', marginBottom: '4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} color="#2563eb" /> Install GoBill App
            </div>
            Tap Share <Share size={14} style={{ verticalAlign: 'middle', color: '#3b82f6' }} /> then <strong>Add to Home Screen</strong>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Install GoBill App
            </div>
            <div style={{ fontSize: '12px', marginTop: '2px', color: '#64748b' }}>For faster access</div>
          </div>
        )}
        
        {!isIOS && (
          <button
            onClick={handleInstallClick}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Install
          </button>
        )}
        
        <button 
          onClick={handleDismiss} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
