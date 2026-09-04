import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BusinessHealth from './pages/BusinessHealth';
import Companies from './pages/Companies';
import CompanyHealth from './pages/CompanyHealth';
import CustomerHealthOverview from './pages/CustomerHealthOverview';
import Opportunities from './pages/Opportunities';
import Products from './pages/Products';
import ProductIntelligence from './pages/ProductIntelligence';
import ProductIntelligenceOverview from './pages/ProductIntelligenceOverview';
import ChatWithAI from './pages/ChatWithAI';
import Quotations from './pages/Quotations';
import QuotationNew from './pages/QuotationNew';
import QuotationDetail from './pages/QuotationDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import PerformaInvoices from './pages/PerformaInvoices';
import Reports from './pages/Reports';
import InactiveCustomers from './pages/InactiveCustomers';
import AwaitingCustomerResponse from './pages/AwaitingCustomerResponse';
import DraftQuotations from './pages/DraftQuotations';
import PurchaseOrdersNotInvoiced from './pages/PurchaseOrdersNotInvoiced';
import FlaggedSalesRecords from './pages/FlaggedSalesRecords';
import OverdueFollowUps from './pages/OverdueFollowUps';
import FollowUpsDueToday from './pages/FollowUpsDueToday';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Setup from './pages/Setup';
import { useAuth } from './auth';
import AppShell from './components/layout/AppShell';

export default function App() {
  const { user, needsSetup, loading } = useAuth();

  if (loading) return <p className="muted loading-text">Loading…</p>;
  if (needsSetup) return <Setup />;
  if (!user) return <Login />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/business-health" element={<BusinessHealth />} />
        <Route path="/customer-health" element={<CustomerHealthOverview />} />
        <Route path="/product-intelligence" element={<ProductIntelligenceOverview />} />
        <Route path="/chat-with-ai" element={<ChatWithAI />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/new" element={<QuotationNew />} />
        <Route path="/quotations/:id" element={<QuotationDetail />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/performa-invoices" element={<PerformaInvoices />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id/health" element={<CompanyHealth />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id/intelligence" element={<ProductIntelligence />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/inactive-customers" element={<InactiveCustomers />} />
        <Route path="/awaiting-customer-response" element={<AwaitingCustomerResponse />} />
        <Route path="/draft-quotations" element={<DraftQuotations />} />
        <Route path="/purchase-orders-not-invoiced" element={<PurchaseOrdersNotInvoiced />} />
        <Route path="/flagged-sales-records" element={<FlaggedSalesRecords />} />
        <Route path="/overdue-follow-ups" element={<OverdueFollowUps />} />
        <Route path="/follow-ups-due-today" element={<FollowUpsDueToday />} />
        <Route path="/settings" element={<Settings />} />
        {user.role === 'admin' && <Route path="/admin" element={<Admin />} />}
      </Routes>
    </AppShell>
  );
}
