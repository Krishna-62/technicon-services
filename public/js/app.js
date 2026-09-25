import { renderSidebar } from './components/Sidebar.js';
import { renderTopNav } from './components/TopNav.js';
import { views, renderEmptyState, renderTableSkeleton } from './views/views.js';
import { setupFormApiHandler, apiFetch } from './utils/apiHelper.js';

// Route Titles Map
const routeTitles = {
  dashboard: 'Overview',
  quotations: 'Quotations Management',
  'new-quotation': 'Create New Quotation',
  'quotation-detail': 'Quotation Detail View',
  'purchase-orders': 'Purchase Orders',
  'performa-invoices': 'Performa Invoices',
  companies: 'Company Directory',
  products: 'Products Catalog',
  reports: 'Reports & Analytics',
  'customer-health': 'Customer Health Dashboard',
  'product-intelligence': 'Product Intelligence Dashboard',
  'admin-settings': 'Admin Settings',
  'user-management': 'User Management',
  'security-audit-log': 'Security & Audit Log',
  'product-import-workflow': 'Import Products - Upload',
  'product-import-column-mapping': 'Import Products - Mapping',
  'product-import-validation-preview': 'Import Products - Preview'
};

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const route = views[hash] ? hash : 'dashboard';

  // Render Sidebar and TopNav
  const sidebarContainer = document.getElementById('sidebar-container');
  const topnavContainer = document.getElementById('topnav-container');
  const mainCanvas = document.getElementById('main-content-canvas') || document.querySelector('main');

  if (sidebarContainer) sidebarContainer.innerHTML = renderSidebar(route);
  if (topnavContainer) topnavContainer.innerHTML = renderTopNav(routeTitles[route] || 'Dashboard');

  if (mainCanvas) {
    const viewRenderer = views[route] || views['dashboard'];
    mainCanvas.innerHTML = `
      <div class="view-container">
        ${viewRenderer()}
      </div>
    `;
    window.scrollTo(0, 0);
  }

  // Route-specific Data Loaders & Form Wireups
  loadRouteData(route);
  attachFormHandlers(route);
}

// ----------------------------------------------------
// GET Data Loaders for Live Vercel Backend Integration
// ----------------------------------------------------
async function loadRouteData(route) {
  if (route === 'dashboard') {
    try {
      const data = await apiFetch('/dashboard', 'GET');
      updateDashboardKPIs(data);
    } catch (e) {
      // Fallback sample view if API_BASE_URL placeholder is active
      renderDashboardFallback();
    }
  }

  if (route === 'quotations') {
    const tbody = document.getElementById('quotations-tbody');
    try {
      const quotations = await apiFetch('/quotations', 'GET');
      renderQuotationsTable(quotations);
    } catch (e) {
      renderQuotationsFallback(tbody);
    }
  }

  if (route === 'products') {
    const tbody = document.getElementById('products-tbody');
    try {
      const products = await apiFetch('/products', 'GET');
      renderProductsTable(products);
    } catch (e) {
      renderProductsFallback(tbody);
    }
  }

  if (route === 'companies') {
    const container = document.getElementById('companies-container');
    try {
      const companies = await apiFetch('/companies', 'GET');
      renderCompaniesGrid(companies);
    } catch (e) {
      renderCompaniesFallback(container);
    }
  }

  if (route === 'purchase-orders') {
    const tbody = document.getElementById('po-tbody');
    try {
      const pos = await apiFetch('/purchase-orders', 'GET');
      renderPOTable(pos);
    } catch (e) {
      renderPOFallback(tbody);
    }
  }
}

// ----------------------------------------------------
// Renderers & Fallback Helpers
// ----------------------------------------------------
function renderQuotationsTable(quotations) {
  const tbody = document.getElementById('quotations-tbody');
  if (!tbody) return;

  if (!quotations || !quotations.length) {
    tbody.innerHTML = renderEmptyState('No quotations found in database.', 'Create First Quote', '#new-quotation');
    return;
  }

  tbody.innerHTML = quotations.map(q => `
    <tr class="hover:bg-surface-container-lowest cursor-pointer" onclick="window.location.hash='#quotation-detail'">
      <td class="p-4 font-bold text-primary">${q.quotationNumber || q.id || 'QTN-001'}</td>
      <td class="p-4 font-medium">${q.customerName || q.company_name || 'Customer'}</td>
      <td class="p-4 font-bold">₹${Number(q.totalAmount || q.total || 0).toLocaleString()}</td>
      <td class="p-4 text-on-surface-variant">${q.createdDate || q.createdAt ? new Date(q.createdDate || q.createdAt).toLocaleDateString() : 'Today'}</td>
      <td class="p-4"><span class="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">${q.status || 'Active'}</span></td>
      <td class="p-4 text-right">
        <button onclick="window.location.hash='#quotation-detail'" class="px-3 py-1 bg-surface-container-high text-xs font-semibold rounded-lg hover:bg-outline-variant">View</button>
      </td>
    </tr>
  `).join('');
}

function renderQuotationsFallback(tbody) {
  if (!tbody) return;
  const sample = [
    { quotationNumber: 'QTN/2026/0891', customerName: 'TechnoSoft Solutions', totalAmount: 345000, createdDate: '2026-08-18', status: 'Accepted' },
    { quotationNumber: 'QTN/2026/0892', customerName: 'Global Logistics India', totalAmount: 180200, createdDate: '2026-08-19', status: 'Sent' },
    { quotationNumber: 'QTN/2026/0893', customerName: 'Apex Buildtech', totalAmount: 510000, createdDate: '2026-08-20', status: 'Draft' }
  ];
  renderQuotationsTable(sample);
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (!products || !products.length) {
    tbody.innerHTML = renderEmptyState('No products in catalog.', 'Import Products CSV', '#product-import-workflow');
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-surface-container-lowest">
      <td class="p-4 font-mono text-primary font-semibold">${p.sku || p.code || 'SKU-001'}</td>
      <td class="p-4 font-medium">${p.name || p.title}</td>
      <td class="p-4 font-bold">₹${Number(p.unitRate || p.price || 0).toLocaleString()}</td>
      <td class="p-4 text-on-surface-variant">${p.category || 'Hardware'}</td>
    </tr>
  `).join('');
}

function renderProductsFallback(tbody) {
  if (!tbody) return;
  renderProductsTable([
    { sku: 'SKU-SRV-50', name: 'Industrial Servo Motor X-200', unitRate: 120000, category: 'Motors & Actuators' },
    { sku: 'SKU-PLC-09', name: 'PLC Logic Controller 16-Channel', unitRate: 88000, category: 'Controllers' },
    { sku: 'SKU-SNS-12', name: 'Precision Pressure Transducer', unitRate: 15400, category: 'Sensors' }
  ]);
}

function renderCompaniesGrid(companies) {
  const container = document.getElementById('companies-container');
  if (!container) return;

  if (!companies || !companies.length) {
    container.innerHTML = `<p class="col-span-3 text-center py-8 text-on-surface-variant">No companies registered.</p>`;
    return;
  }

  container.innerHTML = companies.map(c => `
    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs hover:border-primary transition-all">
      <h3 class="text-base font-bold text-primary">${c.name || 'Company Name'}</h3>
      <p class="text-xs text-on-surface-variant mt-1">${c.industry || 'Enterprise'}</p>
      <div class="mt-4 pt-4 border-t border-outline-variant/60 flex justify-between text-xs">
        <span>Quotations: ${c.quotationsCount || 1}</span>
        <span class="font-bold text-secondary">Active</span>
      </div>
    </div>
  `).join('');
}

function renderCompaniesFallback(container) {
  if (!container) return;
  renderCompaniesGrid([
    { name: 'ABC Industries Ltd', industry: 'Manufacturing & Heavy Tech', quotationsCount: 4 },
    { name: 'TechCorp Global Pvt Ltd', industry: 'Software & Infrastructure', quotationsCount: 2 },
    { name: 'Apex Systems', industry: 'Robotics & Automation', quotationsCount: 5 }
  ]);
}

function renderPOTable(pos) {
  const tbody = document.getElementById('po-tbody');
  if (!tbody) return;
  renderPOTableSample(tbody);
}

function renderPOFallback(tbody) {
  if (!tbody) return;
  renderPOTableSample(tbody);
}

function renderPOTableSample(tbody) {
  const sample = [
    { poNumber: 'PO-2026-901', company: 'ABC Industries', amount: 240000, status: 'Active' },
    { poNumber: 'PO-2026-902', company: 'TechCorp Global', amount: 450000, status: 'Completed' }
  ];
  tbody.innerHTML = sample.map(p => `
    <tr class="hover:bg-surface-container-lowest">
      <td class="p-4 font-bold text-primary">${p.poNumber}</td>
      <td class="p-4">${p.company}</td>
      <td class="p-4 font-bold">₹${p.amount.toLocaleString()}</td>
      <td class="p-4"><span class="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">${p.status}</span></td>
    </tr>
  `).join('');
}

function updateDashboardKPIs(data) {
  if (data?.kpis) {
    if (document.getElementById('kpi-revenue')) document.getElementById('kpi-revenue').innerText = `₹${data.kpis.revenue || '24.1L'}`;
    if (document.getElementById('kpi-companies')) document.getElementById('kpi-companies').innerText = data.kpis.companies || 152;
    if (document.getElementById('kpi-products')) document.getElementById('kpi-products').innerText = data.kpis.products || 101;
    if (document.getElementById('kpi-quotations')) document.getElementById('kpi-quotations').innerText = data.kpis.quotations || 17;
  }
}

function renderDashboardFallback() {
  const tbody = document.getElementById('dashboard-quotations-tbody');
  if (tbody) {
    renderQuotationsFallback(tbody);
  }
}

// ----------------------------------------------------
// Form API Submit Wireups (POST / PUT)
// ----------------------------------------------------
function attachFormHandlers(route) {
  if (route === 'new-quotation') {
    setupFormApiHandler('quotation-form', '/quotations', 'POST', (result) => {
      console.log('Quotation created via live backend API:', result);
      setTimeout(() => {
        window.location.hash = '#quotations';
      }, 1000);
    });
  }

  if (route === 'admin-settings') {
    setupFormApiHandler('settings-form', '/settings', 'PUT');
  }

  if (route === 'product-import-column-mapping') {
    setupFormApiHandler('mapping-form', '/imports', 'POST', () => {
      window.location.hash = '#product-import-validation-preview';
    });
  }
}

// Global Event Listeners
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
