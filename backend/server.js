import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { syncDatabase } from './src/models/index.js';
import { errorHandler } from './src/middleware/error.middleware.js';

// Route Imports
import authRoutes from './src/modules/auth/auth.routes.js';
import companyRoutes from './src/modules/company/company.routes.js';
import customerRoutes from './src/modules/customer/customer.routes.js';
import invoiceRoutes from './src/modules/invoice/invoice.routes.js';
import reportsRoutes from './src/modules/reports/reports.routes.js';
import settingsRoutes from './src/modules/settings/settings.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import subscriptionRoutes from './src/modules/subscription/subscription.routes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://gobill.gldatacenter.com', 'http://localhost:5173', 'http://192.168.1.19:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.get('/', (req, res) => {
  res.send('Billing Simply Backend API running...');
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectDB();
  await syncDatabase(); // Sync models
  console.log(`Server running on port ${PORT}`);
});