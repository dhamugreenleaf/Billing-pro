import * as adminService from '../services/admin.service.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // Only allow admins to view this
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }

    const stats = await adminService.getDashboardStats();
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    const customers = await adminService.getAllCustomers();
    res.status(200).json({ success: true, data: customers });
  } catch (error) { next(error); }
};

export const getCustomerDetails = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const customer = await adminService.getCustomerDetails(req.params.id);
    res.status(200).json({ success: true, data: customer });
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    const result = await adminService.deleteCustomer(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) { next(error); }
};

export const getSettings = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    const settings = await adminService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) { next(error); }
};

export const updateSettings = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    const settings = await adminService.updateSettings(req.body);
    res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) { next(error); }
};

export const updateCustomerStatus = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const updated = await adminService.updateCustomerStatus(req.params.id, req.body.is_active);
    res.status(200).json({ success: true, data: updated, message: 'Status updated' });
  } catch (error) { next(error); }
};

export const getCompanies = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const companies = await adminService.getAllCompanies();
    res.status(200).json({ success: true, data: companies });
  } catch (error) { next(error); }
};

export const getInvoices = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const invoices = await adminService.getAllInvoices();
    res.status(200).json({ success: true, data: invoices });
  } catch (error) { next(error); }
};

export const getIndividualReports = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const reports = await adminService.getIndividualReports();
    res.status(200).json({ success: true, data: reports });
  } catch (error) { next(error); }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    const { name, mobile_number } = req.body;
    const updatedUser = await adminService.updateAdminProfile(req.user.id, { name, mobile_number });
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) { next(error); }
};
