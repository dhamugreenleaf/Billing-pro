import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ReceiptText, FileBarChart2, Settings, User, LogOut, ChevronDown, Crown } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import api from '../utils/api';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user && user.profile_completed) {
      api.get('/company').then(res => {
        if (res.data) setCompanyData(res.data);
      }).catch(err => console.error("Could not fetch company profile", err));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = () => {
    if (companyData?.company_name) return companyData.company_name.substring(0, 2).toUpperCase();
    if (user?.name) return user.name.substring(0, 2).toUpperCase();
    return 'US';
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const displayName = toTitleCase(user?.name) || 'User Name';
  const displayCompany = toTitleCase(companyData?.company_name) || 'Business Name';
  const displayOwner = toTitleCase(companyData?.owner_name) || displayName;

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/bills', label: 'Bills', icon: <ReceiptText size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileBarChart2 size={20} /> },
    { path: '/plans', label: 'Plans', icon: <Crown size={20} /> },
  ];

  const isSetupPage = location.pathname === '/setup';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-main)' }}>
      {/* Mobile Top Header (hidden on large screens ideally, but keeping it simple) */}
      {!isSetupPage && (
        <header className="no-print" style={{ 
          backgroundColor: '#ffffff', 
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Billing Pro</h2>
            
            <div className="header-profile" ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="User profile menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '2rem',
                  transition: 'background-color 0.2s',
                }}
                className="profile-btn-hover"
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  border: '1px solid #bfdbfe'
                }}>
                  {getInitials()}
                </div>
                <div className="profile-text-desktop" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>{displayCompany}</span>
                  <ChevronDown size={16} color="#64748b" />
                </div>
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  width: '260px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  zIndex: 50
                }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '1rem',
                      border: '1px solid #bfdbfe',
                      flexShrink: 0
                    }}>
                      {getInitials()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayCompany}</div>
                      <div style={{ color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayOwner}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    <button onClick={() => { setProfileOpen(false); navigate('/setup'); }} style={dropdownItemStyle}>
                      <User size={16} /> Profile Settings &rarr;
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate('/settings'); }} style={dropdownItemStyle}>
                      <Settings size={16} /> Account Settings &rarr;
                    </button>
                  </div>
                  <div style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                      onClick={() => { setProfileOpen(false); setShowLogoutDialog(true); }} 
                      style={{ ...dropdownItemStyle, color: '#dc2626' }}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      {!isSetupPage && (
        <nav className="no-print" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: 'var(--spacing-sm) 0',
          zIndex: 10
        }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                <div style={{ marginBottom: '4px' }}>{item.icon}</div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {showLogoutDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Logout?</h3>
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Are you sure you want to logout from Billing Pro?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setShowLogoutDialog(false)}
                style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogoutConfirm}
                style={{ padding: '0.5rem 1rem', background: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .profile-text-desktop {
            display: flex !important;
          }
        }
        .profile-btn-hover:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '0.5rem',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  color: '#334155',
  fontSize: '0.9rem',
  borderRadius: '6px',
  transition: 'background-color 0.2s'
};

export default MainLayout;
