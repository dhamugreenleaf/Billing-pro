import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Users, Building, FileText, 
  BarChart, Package, Settings, LogOut, Menu, X, FileSignature 
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
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', exact: true },
    { to: '/admin/customers', icon: <Users size={20} />, label: 'Customers' },
    { to: '/admin/reports', icon: <BarChart size={20} />, label: 'Reports' },
    { to: '/admin/plans', icon: <Package size={20} />, label: 'Plans & Subs' },
    { to: '/admin/formats', icon: <FileSignature size={20} />, label: 'Invoice Formats' },
    { to: '/admin/gst', icon: <FileText size={20} />, label: 'GST Settings' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Admin Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-menu-toggle d-md-none" onClick={toggleSidebar}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={24} color="#3b82f6" />
            <h2 className="admin-logo-text">Billing Pro Admin</h2>
          </div>
        </div>
        
        <div className="admin-header-right">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            <span className="d-none d-sm-inline">Logout</span>
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
                {link.label}
              </NavLink>
            ))}
          </nav>
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
