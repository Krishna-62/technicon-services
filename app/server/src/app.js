import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import './db/index.js';

import { requireAuth } from './auth/middleware.js';

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import companiesRouter from './routes/companies.js';
import productsRouter from './routes/products.js';
import quotationsRouter from './routes/quotations.js';
import purchaseOrdersRouter from './routes/purchaseOrders.js';
import performaInvoicesRouter from './routes/performaInvoices.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import importsRouter from './routes/imports.js';

const app = express();

app.set('trust proxy', 1);

// Restrict CORS in production if CLIENT_ORIGIN is set.
// Allow all origins for local development.
const allowedOrigin = process.env.CLIENT_ORIGIN || true;

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/companies', requireAuth, companiesRouter);
app.use('/api/products', requireAuth, productsRouter);
app.use('/api/quotations', requireAuth, quotationsRouter);
app.use('/api/purchase-orders', requireAuth, purchaseOrdersRouter);
app.use('/api/performa-invoices', requireAuth, performaInvoicesRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/imports', requireAuth, importsRouter);
app.use('/api/admin', adminRouter);

// Export Express app for Vercel
export default app;