import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Users, Building, FileText, 
  BarChart, Package, Settings, LogOut, Menu, X, FileSignature, ShieldCheck
} from 'lucide-react';
import { logout } from '../redux/authSlice';
import useSEO from '../utils/useSEO';
import '../styles/admin.css';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useSEO({ noindex: true });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  const navLinks = [
    { to: '/admin', icon: <LayoutDashboard size={19} />, label: 'Dashboard', exact: true },
    { to: '/admin/customers', icon: <Users size={19} />, label: 'Customers' },
    { to: '/admin/reports', icon: <BarChart size={19} />, label: 'Reports' },
    { to: '/admin/plans', icon: <Package size={19} />, label: 'Plans & Subs' },
    { to: '/admin/formats', icon: <FileSignature size={19} />, label: 'Invoice Formats' },
    { to: '/admin/gst', icon: <FileText size={19} />, label: 'GST Settings' },
    { to: '/admin/settings', icon: <Settings size={19} />, label: 'Admin Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button 
            className="admin-menu-toggle d-md-none" 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
              color: '#ffffff'
            }}>
              <LayoutDashboard size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 className="admin-logo-text" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>GoBill</h2>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#1e3a8a', color: '#93c5fd', padding: '1px 6px', borderRadius: 4, border: '1px solid #2563eb' }}>ADMIN</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Command Center</span>
            </div>
          </div>
        </div>
        
        <div className="admin-header-right">
          <button onClick={handleLogout} className="admin-logout-btn" title="Sign out of Admin">
            <LogOut size={16} />
            <span className="d-none d-sm-inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Mobile Overlay */}
        <div 
          className={`admin-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
        ></div>

        {/* Sidebar */}
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <nav className="admin-nav">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to}
                to={link.to} 
                end={link.exact}
                onClick={closeSidebar}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
          
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Admin Secure Session</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
