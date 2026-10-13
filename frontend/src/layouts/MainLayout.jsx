import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ReceiptText, 
  FileBarChart2, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown, 
  Crown, 
  Package, 
  Plus, 
  Receipt, 
  ShieldCheck, 
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../redux/authSlice';
import api from '../utils/api';
import useSEO from '../utils/useSEO';
import useTheme from '../utils/useTheme';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useSEO({ noindex: true });
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'light';
  const toggleTheme = themeContext?.toggleTheme || (() => {});

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const dropdownRef = useRef(null);

  // Sync user profile & subscription status with backend
  useEffect(() => {
    if (user) {
      api.get('/auth/me').then(res => {
        if (res.data?.data?.user) {
          const fetchedUser = res.data.data.user;
          if (fetchedUser.subscription_status !== user.subscription_status) {
            dispatch(updateUser(fetchedUser));
          }
        }
      }).catch(err => {
        // Silently handle if network or endpoint fails
      });
    }
  }, [user?.id]);

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
    return 'BP';
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const displayName = toTitleCase(user?.name) || 'User';
  const displayCompany = toTitleCase(companyData?.company_name) || 'GoBill';
  const displayOwner = toTitleCase(companyData?.owner_name) || displayName;

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={18} /> },
    { path: '/bills', label: 'Bills', icon: <ReceiptText size={18} /> },
    ...(user?.subscription_status === 'paid' ? [{ path: '/products', label: 'Products', icon: <Package size={18} /> }] : []),
    { path: '/reports', label: 'Reports', icon: <FileBarChart2 size={18} /> },
    { path: '/plans', label: 'Plans', icon: <Crown size={18} /> },
  ];

  const isSetupPage = location.pathname === '/setup';
  const isTermsPage = location.pathname === '/terms';
  const isInvoiceCreatePage = location.pathname === '/invoice/new';
  const isInvoicePreviewPage = location.pathname.includes('/invoice/') && location.pathname.includes('/preview');
  const hideHeaderFooter = isSetupPage || isTermsPage || isInvoiceCreatePage || isInvoicePreviewPage;

  // Enforce Terms & Conditions check
  useEffect(() => {
    if (user && user.profile_completed && !user.terms_accepted_at && !isTermsPage) {
      navigate('/terms');
    }
  }, [user, isTermsPage, navigate]);

  return (
    <div className="main-layout-root">
      {/* Top Header */}
      {!hideHeaderFooter && (
        <header className="main-header no-print">
          <div className="container main-header-inner">
            {/* Brand Logo & Name */}
            <Link to="/" className="main-brand-link" aria-label="GoBill Home">
              <div className="main-brand-logo-icon">
                <Receipt size={22} />
              </div>
              <div className="main-brand-text-wrap">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h1 className="main-brand-title">GoBill</h1>
                  <span className="main-brand-badge">PRO</span>
                </div>
                <span className="main-brand-tagline">GST POS & Invoicing</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="main-desktop-nav" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`main-nav-pill ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Header Right Actions */}
            <div className="main-header-actions">
              {/* Theme Toggle Button */}
              <button
                type="button"
                className="main-theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} color="#fbbf24" strokeWidth={2.4} /> : <Moon size={18} color="#ffffff" strokeWidth={2.4} />}
              </button>


              {/* Profile Menu Trigger */}
              <div className="header-profile" ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                  className="main-profile-trigger"
                >
                  <div className="main-profile-avatar">
                    {getInitials()}
                  </div>
                  <div className="main-profile-text-wrap">
                    <span className="main-profile-company">{displayCompany}</span>
                    <span className="main-profile-owner">{displayOwner}</span>
                  </div>
                  <ChevronDown size={15} color="rgba(255, 255, 255, 0.9)" style={{ marginLeft: '2px' }} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="main-profile-dropdown" role="menu">
                    <div className="main-dropdown-header">
                      <div className="main-profile-avatar" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                        {getInitials()}
                      </div>
                      <div className="main-dropdown-header-info">
                        <div className="main-dropdown-company-name">{displayCompany}</div>
                        <div className="main-dropdown-owner-name">{displayOwner}</div>
                        <div className="main-dropdown-status">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                          <span>Active Account</span>
                        </div>
                      </div>
                    </div>

                    <div className="main-dropdown-menu-list">
                      <button
                        type="button"
                        role="menuitem"
                        className="main-dropdown-item"
                        onClick={() => { setProfileOpen(false); navigate('/setup'); }}
                      >
                        <span className="main-dropdown-item-left">
                          <User size={16} color="#475569" />
                          <span>Business Profile</span>
                        </span>
                        <ChevronRight size={14} color="#94a3b8" />
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        className="main-dropdown-item"
                        onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                      >
                        <span className="main-dropdown-item-left">
                          <Settings size={16} color="#475569" />
                          <span>Settings & GST</span>
                        </span>
                        <ChevronRight size={14} color="#94a3b8" />
                      </button>

                      <div className="main-dropdown-divider" />

                      <button
                        type="button"
                        role="menuitem"
                        className="main-dropdown-item danger"
                        onClick={() => { setProfileOpen(false); setShowLogoutDialog(true); }}
                      >
                        <span className="main-dropdown-item-left">
                          <LogOut size={16} />
                          <span>Logout</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="main-content-body">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Navigation Dock */}
      {!hideHeaderFooter && (
        <nav className="main-mobile-nav no-print" aria-label="Mobile Bottom Navigation">
          <Link
            to="/"
            className={`main-mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <div className="main-mobile-nav-icon"><Home size={19} /></div>
            <span>Home</span>
          </Link>

          <Link
            to="/bills"
            className={`main-mobile-nav-item ${location.pathname === '/bills' ? 'active' : ''}`}
          >
            <div className="main-mobile-nav-icon"><ReceiptText size={19} /></div>
            <span>Bills</span>
          </Link>

          {/* Elevated Center Quick Invoice Action Button */}
          <button
            type="button"
            className="main-mobile-nav-fab"
            onClick={() => navigate('/invoice/new')}
            title="Create New Invoice"
            aria-label="New Bill"
          >
            <Plus size={24} strokeWidth={2.8} />
          </button>

          {user?.subscription_status === 'paid' ? (
            <Link
              to="/products"
              className={`main-mobile-nav-item ${location.pathname === '/products' ? 'active' : ''}`}
            >
              <div className="main-mobile-nav-icon"><Package size={19} /></div>
              <span>Products</span>
            </Link>
          ) : (
            <Link
              to="/reports"
              className={`main-mobile-nav-item ${location.pathname === '/reports' ? 'active' : ''}`}
            >
              <div className="main-mobile-nav-icon"><FileBarChart2 size={19} /></div>
              <span>Reports</span>
            </Link>
          )}

          <Link
            to="/plans"
            className={`main-mobile-nav-item ${location.pathname === '/plans' ? 'active' : ''}`}
          >
            <div className="main-mobile-nav-icon"><Crown size={19} /></div>
            <span>Plans</span>
          </Link>
        </nav>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="main-modal-overlay" onClick={() => setShowLogoutDialog(false)}>
          <div className="main-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="main-modal-header">
              <div className="main-modal-icon-wrap">
                <LogOut size={22} />
              </div>
              <div>
                <h3 className="main-modal-title">Sign Out?</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Confirm session termination</span>
              </div>
            </div>
            <p className="main-modal-desc">
              Are you sure you want to log out from <strong>GoBill</strong>? You can sign back in anytime with your registered credentials.
            </p>
            <div className="main-modal-actions">
              <button
                type="button"
                className="main-modal-btn-cancel"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="main-modal-btn-danger"
                onClick={handleLogoutConfirm}
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
