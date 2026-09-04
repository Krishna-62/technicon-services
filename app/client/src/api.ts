// In local dev this stays '/api' and goes through Vite's proxy (vite.config.ts) to localhost:4000.
// In production, frontend and API are served from the same Vercel deployment/domain, so '/api'
// resolves correctly there too. VITE_API_URL is only needed if the API is split to another domain.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Company {
  id: number;
  name: string;
  address: string | null;
  state: string | null;
  gstin: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
}

export type CustomerHealthStatus = 'new' | 'strong' | 'active' | 'at_risk' | 'inactive' | 'no_history';

export interface CompanyHealthData {
  company: { id: number; name: string };
  health: {
    status: CustomerHealthStatus;
    label: string;
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
    daysSinceLastOrder: number | null;
    lapseMonths: number;
  };
}

export interface CustomerHealthSummaryRow {
  company_id: number;
  company_name: string;
  status: CustomerHealthStatus;
  label: string;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  lapseMonths: number;
}

export interface CustomerHealthSummaryData {
  customers: CustomerHealthSummaryRow[];
  summary: {
    total: number;
    active: number;
    strong: number;
    atRisk: number;
    inactive: number;
    new: number;
    noHistory: number;
  };
}

export type ProductTrendDirection = 'growing' | 'declining' | 'stable' | 'no_data';

export interface ProductIntelligenceData {
  product: { id: number; part_no: string; description: string };
  sales: {
    revenue: number;
    unitsSold: number;
    customers: number;
    avgSellingPrice: number;
    orderCount: number;
    firstSaleDate: string | null;
    lastSaleDate: string | null;
  };
  trend: {
    direction: ProductTrendDirection;
    pctChange: number | null;
    recentRevenue: number;
    priorRevenue: number;
  };
  quotationActivity: {
    quotedLineCount: number;
    quotedQty: number;
    quotationCount: number;
  };
}

export interface ProductIntelligenceSummaryRow {
  id: number;
  part_no: string;
  description: string;
  revenue: number;
  unitsSold: number;
  customers: number;
  avgSellingPrice: number;
  orderCount: number;
  firstSaleDate: string | null;
  lastSaleDate: string | null;
  trendDirection: ProductTrendDirection;
  pctChange: number | null;
  quotedLineCount: number;
  quotedQty: number;
  quotationCount: number;
}

export interface ProductIntelligenceSummaryData {
  products: ProductIntelligenceSummaryRow[];
  summary: {
    totalProducts: number;
    productsWithSales: number;
    topRevenueProduct: { part_no: string; description: string; revenue: number } | null;
    topUnitsProduct: { part_no: string; description: string; unitsSold: number } | null;
  };
}

export interface Product {
  id: number;
  part_no: string;
  hsn_sac: string | null;
  description: string;
  unit: string;
  default_price: number;
}

export interface ProductImportErrorRow {
  rowNumber: number;
  productName: string | null;
  partNo: string | null;
  price: number | null;
  errors: string[];
}

export interface ProductImportValidRow {
  rowNumber: number;
  productName: string;
  partNo: string;
  price: number;
}

export interface ProductImportNewRow {
  rowNumber: number;
  productName: string;
  partNo: string;
  price: number;
}

export interface ProductImportUpdateRow {
  rowNumber: number;
  productName: string;
  partNo: string;
  currentPrice: number;
  newPrice: number;
}

export interface ProductImportPreview {
  summary: { totalRows: number; newCount: number; updateCount: number; errorCount: number };
  newRows: ProductImportNewRow[];
  updateRows: ProductImportUpdateRow[];
  errorRows: ProductImportErrorRow[];
  validRows: ProductImportValidRow[];
}

export interface ProductImportResult {
  created: number;
  updated: number;
  errors: number;
}

export interface QuotationItem {
  id?: number;
  product_id: number | null;
  part_no: string | null;
  description: string;
  hsn_sac: string | null;
  qty: number;
  price: number;
  amount?: number;
}

export interface Quotation {
  id: number;
  number: string;
  date: string;
  company_id: number;
  company_name?: string;
  status: string;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  notes: string;
  items?: QuotationItem[];
}

export interface PurchaseOrder {
  id: number;
  number: string;
  date: string;
  quotation_id: number;
  quotation_number?: string;
  company_name?: string;
  client_po_ref: string | null;
  status: string;
  total?: number;
}

export interface PerformaInvoice {
  id: number;
  number: string;
  date: string;
  quotation_id: number;
  quotation_number?: string;
  purchase_order_id: number | null;
  company_name?: string;
  status: string;
  total?: number;
}

export interface QuotationFollowUp {
  id: number;
  quotation_id: number;
  follow_up_date: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: number;
  created_by_username?: string;
  created_at: string;
  completed_at: string | null;
  completed_by: number | null;
  completed_by_username?: string | null;
  outcome: string | null;
  outcome_notes: string | null;
}

export interface QuotationFollowUpsData {
  followUps: QuotationFollowUp[];
}

export interface CompanySettings {
  id: number;
  company_name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  bank_details: string;
  terms_conditions: string;
  logo_path: string;
  quotation_prefix: string;
  po_prefix: string;
  pi_prefix: string;
  default_tax_percent: number;
  default_lapse_months: number;
}

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'staff';
}

export interface AdminUser {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface DashboardData {
  historicalRevenue: number;
  acceptedQuotationRevenue: number;
  monthlyTrend: { month: string; total: number }[];
  topCompanies: { company_name: string; total: number; orders: number }[];
  topProducts: { part_no: string; product_description: string; total: number; qty: number }[];
  counts: {
    companies: number;
    products: number;
    quotations: number;
    purchaseOrders: number;
    performaInvoices: number;
    rowsNeedingReview: number;
  };
}

export interface BusinessHealthComponent {
  label: string;
  score: number | null;
  detail: string;
}

export interface BusinessHealthRecommendation {
  component: 'sales' | 'customerHealth' | 'followUps' | 'conversions' | 'repeatBusiness';
  title: string;
  detail: string;
}

export interface BusinessHealthData {
  overallScore: number | null;
  tier: 'green' | 'yellow' | 'red' | null;
  tierLabel: string | null;
  components: {
    sales: BusinessHealthComponent;
    customerHealth: BusinessHealthComponent;
    followUps: BusinessHealthComponent;
    conversions: BusinessHealthComponent;
    repeatBusiness: BusinessHealthComponent;
  };
  recommendation: BusinessHealthRecommendation | null;
}

export interface InactiveCustomer {
  company_name: string;
  last_purchase: string;
  months_inactive: number;
  total_revenue: number;
}

export interface InactiveCustomersData {
  count: number;
  months: number;
  customers: InactiveCustomer[];
}

export interface AwaitingResponseQuotation {
  id: number;
  number: string;
  company_name: string;
  date: string;
  total: number;
  status: string;
}

export interface AwaitingCustomerResponseData {
  count: number;
  quotations: AwaitingResponseQuotation[];
}

export interface DraftQuotationSummary {
  id: number;
  number: string;
  company_name: string;
  date: string;
  total: number;
  status: string;
}

export interface DraftQuotationsData {
  count: number;
  quotations: DraftQuotationSummary[];
}

export interface PurchaseOrderNotInvoiced {
  id: number;
  number: string;
  quotation_id: number;
  quotation_number: string;
  company_name: string;
  date: string;
  total: number;
  client_po_ref: string | null;
}

export interface PurchaseOrdersNotInvoicedData {
  count: number;
  purchaseOrders: PurchaseOrderNotInvoiced[];
}

export interface FlaggedSalesRecord {
  id: number;
  sale_date: string | null;
  invoice_no: string | null;
  company_name: string | null;
  po_no: string | null;
  part_no: string | null;
  product_description: string | null;
  price: number | null;
  qty: number | null;
  total_amount: number | null;
  review_reason: string | null;
}

export interface FlaggedSalesRecordsData {
  count: number;
  records: FlaggedSalesRecord[];
}

export type PipelineStageKey = 'draft' | 'sent' | 'accepted' | 'purchase_order' | 'performa_invoice' | 'lost';

export interface PipelineStage {
  key: PipelineStageKey;
  label: string;
  count: number;
  value: number;
}

export interface PipelineData {
  stages: PipelineStage[];
  summary: {
    totalOpportunities: number;
    totalValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
  };
  fulfillment: {
    acceptedCount: number;
    purchaseOrderCount: number;
    performaInvoiceCount: number;
  };
}

export interface DashboardFollowUp {
  id: number;
  quotation_id: number;
  quotation_number: string;
  company_name: string;
  follow_up_date: string;
  notes: string | null;
  created_at: string;
  created_by_username: string;
}

export interface DashboardFollowUpsData {
  summary: {
    overdueCount: number;
    dueTodayCount: number;
    upcomingCount: number;
    totalScheduledCount: number;
  };
  overdue: DashboardFollowUp[];
  dueToday: DashboardFollowUp[];
  upcoming: DashboardFollowUp[];
}

export interface OverdueFollowUpsData {
  count: number;
  followUps: DashboardFollowUp[];
}

export interface DueTodayFollowUpsData {
  count: number;
  followUps: DashboardFollowUp[];
}

export interface RecentActivityItem {
  type: 'quotation' | 'purchase_order' | 'performa_invoice';
  id: number;
  number: string;
  company_name: string | null;
  status: string;
  date: string;
}

export interface RecentActivityData {
  activity: RecentActivityItem[];
}

export interface AttentionItem {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count: number;
  route: string;
}

export interface AttentionData {
  summary: { total: number; highPriority: number };
  items: AttentionItem[];
}

export type OpportunityType = 'cross_sell' | 'at_risk' | 'high_value' | 'quotation_conversion';

export interface Opportunity {
  type: OpportunityType;
  priority: 'high' | 'medium' | 'low';
  company_id: number | null;
  company_name: string;
  title: string;
  description: string;
  action: string;
  evidence: Record<string, any>;
}

export interface OpportunitiesData {
  opportunities: Opportunity[];
  summary: { total: number; highPriority: number };
}

export type AiIntent =
  | 'sales_summary'
  | 'top_customers'
  | 'top_products'
  | 'sales_by_customer'
  | 'sales_by_product'
  | 'revenue_comparison'
  | 'inactive_customers'
  | 'quotation_search'
  | 'quotation_summary'
  | 'pipeline_value'
  | 'awaiting_customer_response'
  | 'purchase_order_summary'
  | 'performa_invoice_summary'
  | 'customer_summary'
  | 'follow_up_summary'
  | 'product_performance'
  | 'business_health_summary'
  | 'customer_health_summary'
  | 'growth_opportunities_summary'
  | null;

export interface AiAskResponse {
  answer: string;
  intent: AiIntent;
  data: Record<string, any> | null;
  sources: { type: string; label: string }[];
  meta: { generatedAt: string; params: Record<string, any> };
}

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const api = {
  companies: {
    list: (q?: string) => request<Company[]>(`/companies${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id: number) => request<Company>(`/companies/${id}`),
    create: (data: Partial<Company>) => request<Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Company>) =>
      request<Company>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    health: (id: number) => request<CompanyHealthData>(`/companies/${id}/health`),
    healthSummary: () => request<CustomerHealthSummaryData>('/companies/health-summary'),
  },
  products: {
    list: (q?: string) => request<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id: number) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    intelligence: (id: number) => request<ProductIntelligenceData>(`/products/${id}/intelligence`),
    intelligenceSummary: () => request<ProductIntelligenceSummaryData>('/products/intelligence-summary'),
    templateUrl: () => `${BASE}/products/import/template`,
    importPreview: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE}/products/import/preview`, { method: 'POST', body: formData, credentials: 'include' });
      const body = await res.json().catch(() => ({ error: res.statusText }));
      if (!res.ok) throw new Error(body.error || `Preview failed: ${res.status}`);
      return body as ProductImportPreview;
    },
    importCommit: (rows: ProductImportValidRow[]) =>
      request<ProductImportResult>('/products/import', { method: 'POST', body: JSON.stringify({ rows }) }),
  },
  quotations: {
    list: () => request<Quotation[]>('/quotations'),
    get: (id: number) => request<Quotation>(`/quotations/${id}`),
    create: (data: Partial<Quotation>) => request<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Quotation>) =>
      request<Quotation>(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    setStatus: (id: number, status: string) =>
      request<Quotation>(`/quotations/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    pdfUrl: (id: number) => `${BASE}/quotations/${id}/pdf`,
    followUps: {
      list: (quotationId: number) => request<QuotationFollowUpsData>(`/quotations/${quotationId}/follow-ups`),
      create: (quotationId: number, data: { follow_up_date: string; notes?: string }) =>
        request<QuotationFollowUp>(`/quotations/${quotationId}/follow-ups`, { method: 'POST', body: JSON.stringify(data) }),
      complete: (quotationId: number, followUpId: number, data: { outcome?: string; outcome_notes?: string }) =>
        request<QuotationFollowUp>(`/quotations/${quotationId}/follow-ups/${followUpId}/complete`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      cancel: (quotationId: number, followUpId: number) =>
        request<QuotationFollowUp>(`/quotations/${quotationId}/follow-ups/${followUpId}/cancel`, {
          method: 'POST',
          body: JSON.stringify({}),
        }),
    },
  },
  purchaseOrders: {
    list: () => request<PurchaseOrder[]>('/purchase-orders'),
    get: (id: number) => request<PurchaseOrder>(`/purchase-orders/${id}`),
    create: (data: { quotation_id: number; client_po_ref?: string; date?: string }) =>
      request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    pdfUrl: (id: number) => `${BASE}/purchase-orders/${id}/pdf`,
  },
  performaInvoices: {
    list: () => request<PerformaInvoice[]>('/performa-invoices'),
    get: (id: number) => request<PerformaInvoice>(`/performa-invoices/${id}`),
    create: (data: { quotation_id: number; purchase_order_id?: number; date?: string }) =>
      request<PerformaInvoice>('/performa-invoices', { method: 'POST', body: JSON.stringify(data) }),
    pdfUrl: (id: number) => `${BASE}/performa-invoices/${id}/pdf`,
  },
  dashboard: {
    get: () => request<DashboardData>('/dashboard'),
    attention: () => request<AttentionData>('/dashboard/attention'),
    pipeline: () => request<PipelineData>('/dashboard/pipeline'),
    inactiveCustomers: () => request<InactiveCustomersData>('/dashboard/inactive-customers'),
    awaitingCustomerResponse: () => request<AwaitingCustomerResponseData>('/dashboard/awaiting-customer-response'),
    draftQuotations: () => request<DraftQuotationsData>('/dashboard/draft-quotations'),
    purchaseOrdersNotInvoiced: () => request<PurchaseOrdersNotInvoicedData>('/dashboard/purchase-orders-not-invoiced'),
    flaggedSalesRecords: () => request<FlaggedSalesRecordsData>('/dashboard/flagged-sales-records'),
    followUps: () => request<DashboardFollowUpsData>('/dashboard/follow-ups'),
    overdueFollowUps: () => request<OverdueFollowUpsData>('/dashboard/overdue-follow-ups'),
    followUpsDueToday: () => request<DueTodayFollowUpsData>('/dashboard/follow-ups-due-today'),
    recentActivity: () => request<RecentActivityData>('/dashboard/recent-activity'),
    businessHealth: () => request<BusinessHealthData>('/dashboard/business-health'),
  },
  reports: {
    companies: () => request<any[]>('/reports/companies'),
    companyHistory: (name: string) => request<any[]>(`/reports/companies/${encodeURIComponent(name)}/history`),
    products: () => request<any[]>('/reports/products'),
    reviewQueue: () => request<any[]>('/reports/review-queue'),
    lapsed: (months: number) => request<any[]>(`/reports/lapsed?months=${months}`),
    companyYearly: (company: string) => request<any>(`/reports/company-yearly?company=${encodeURIComponent(company)}`),
    companyYearComparison: (company: string) =>
      request<{ years: string[]; products: any[] }>(`/reports/companies/${encodeURIComponent(company)}/year-comparison`),
    exportUrl: (type: 'companies' | 'products') => `${BASE}/reports/export?type=${type}`,
  },
  settings: {
    get: () => request<CompanySettings>('/settings'),
    update: (data: Partial<CompanySettings>) => request<CompanySettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  imports: {
    list: () => request<any[]>('/imports'),
    upload: async (file: File, yearLabel: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year_label', yearLabel);
      const res = await fetch(`${BASE}/imports`, { method: 'POST', body: formData, credentials: 'include' });
      const body = await res.json().catch(() => ({ error: res.statusText }));
      if (!res.ok) throw new Error(body.error || `Upload failed: ${res.status}`);
      return body;
    },
  },
  auth: {
    me: async (): Promise<{ needsSetup?: boolean; user?: AuthUser }> => {
      const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
      if (res.status === 401) return {};
      return res.json();
    },
    setup: (username: string, password: string) =>
      request<{ user: AuthUser }>('/auth/setup', { method: 'POST', body: JSON.stringify({ username, password }) }),
    login: (username: string, password: string) =>
      request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  },
  admin: {
    stats: () => request<{ counts: Record<string, number>; dbSizeBytes: number }>('/admin/stats'),
    deleteImport: (id: number) => request<{ ok: true }>(`/admin/imports/${id}`, { method: 'DELETE' }),
    deleteCompany: (id: number) => request<{ ok: true }>(`/admin/companies/${id}`, { method: 'DELETE' }),
    deleteProduct: (id: number) => request<{ ok: true }>(`/admin/products/${id}`, { method: 'DELETE' }),
    dismissReview: (id: number) => request<{ ok: true }>(`/admin/review-queue/${id}/dismiss`, { method: 'POST' }),
    deleteReview: (id: number) => request<{ ok: true }>(`/admin/review-queue/${id}`, { method: 'DELETE' }),
    getConfig: () => request<{ default_tax_percent: number; default_lapse_months: number }>('/admin/config'),
    updateConfig: (data: { default_tax_percent?: number; default_lapse_months?: number }) =>
      request<{ default_tax_percent: number; default_lapse_months: number }>('/admin/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    backupUrl: () => `${BASE}/admin/backup`,
    listUsers: () => request<AdminUser[]>('/admin/users'),
    createUser: (data: { username: string; password: string; role: string }) =>
      request<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    deleteUser: (id: number) => request<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: number, password: string) =>
      request<{ ok: true }>(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  },
  ai: {
    ask: (question: string, history?: AiChatMessage[]) =>
      request<AiAskResponse>('/ai/ask', { method: 'POST', body: JSON.stringify({ question, history: history || [] }) }),
  },
  opportunities: {
    list: () => request<OpportunitiesData>('/opportunities'),
  },
};
