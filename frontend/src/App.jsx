import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import PwaInstallPrompt from './components/PwaInstallPrompt';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Modules
import Login from './modules/auth/Login';
import TestLogin from './modules/auth/TestLogin';
import TermsConditions from './modules/auth/TermsConditions';
import AdminDashboard from './modules/admin/dashboard/AdminDashboard';
import AdminCustomers from './modules/admin/customers/AdminCustomers';
import AdminCustomerDetails from './modules/admin/customers/AdminCustomerDetails';
import AdminCompanies from './modules/admin/companies/AdminCompanies';
import AdminInvoices from './modules/admin/invoices/AdminInvoices';
import AdminReports from './modules/admin/reports/AdminReports';
import AdminPlans from './modules/admin/plans/AdminPlans';
import AdminInvoiceFormats from './modules/admin/invoices/AdminInvoiceFormats';
import AdminGstSettings from './modules/admin/settings/AdminGstSettings';
import AdminSettings from './modules/admin/settings/AdminSettings';
import CompanySetup from './modules/company/CompanySetup';
import Home from './modules/invoice/Home';
import InvoiceForm from './modules/invoice/InvoiceForm';
import InvoicePreview from './modules/invoice/InvoicePreview';
import InvoiceHistory from './modules/invoice/InvoiceHistory';
import Reports from './modules/reports/Reports';
import Settings from './modules/settings/Settings';
import GstSettings from './modules/settings/GstSettings';
import TermsAndConditionsPage from './modules/settings/TermsAndConditions';
import PrivacyPolicyPage from './modules/settings/PrivacyPolicy';
import CustomerPlans from './modules/subscription/CustomerPlans';
import Products from './modules/product/Products';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If logged in but wrong role, redirect to their appropriate home
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/test-login" element={<TestLogin />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:id" element={<AdminCustomerDetails />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="formats" element={<AdminInvoiceFormats />} />
          <Route path="gst" element={<AdminGstSettings />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Customer Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="setup" element={<CompanySetup />} />
          <Route path="terms" element={<TermsConditions />} />
          <Route path="invoice/new" element={<InvoiceForm />} />
          <Route path="invoice/:id/preview" element={<InvoicePreview />} />
          <Route path="bills" element={<InvoiceHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="plans" element={<CustomerPlans />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/gst" element={<GstSettings />} />
          <Route path="settings/terms" element={<TermsAndConditionsPage />} />
          <Route path="settings/privacy" element={<PrivacyPolicyPage />} />
          <Route path="products" element={<Products />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallPrompt />
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
