// View Renderers & Skeletons for Technicon Enterprise UI/UX

export function renderTableSkeleton(cols = 5, rows = 3) {
  return Array(rows).fill(0).map(() => `
    <tr class="animate-pulse border-b border-outline-variant/30">
      ${Array(cols).fill(0).map(() => `
        <td class="p-4">
          <div class="h-4 bg-surface-container-high rounded w-3/4"></div>
        </td>
      `).join('')}
    </tr>
  `).join('');
}

export function renderEmptyState(message = 'No data available.', ctaText = '', ctaHash = '') {
  return `
    <tr>
      <td colspan="10" class="p-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-[48px] text-outline mb-2">inbox</span>
        <p class="text-sm font-semibold text-on-background">${message}</p>
        ${ctaText ? `
          <button onclick="window.location.hash='${ctaHash}'" class="mt-4 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary-container">
            ${ctaText}
          </button>
        ` : ''}
      </td>
    </tr>
  `;
}

export const views = {
  dashboard: () => `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="font-display-md text-2xl font-bold text-on-background mb-1">Overview</h1>
        <p class="text-body-md text-on-surface-variant">Real-time performance metrics and active sales pipeline.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-primary bg-surface hover:bg-surface-container-low transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">calendar_today</span>
          <span>This Month</span>
        </button>
        <button onclick="window.location.hash='#new-quotation'" class="px-4 py-2 rounded-lg text-sm font-semibold text-on-primary bg-primary-container hover:bg-primary transition-colors shadow-xs flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>New Quotation</span>
        </button>
      </div>
    </div>

    <!-- Top KPI Row -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      <div class="col-span-2 md:col-span-3 lg:col-span-2 bg-primary-container rounded-xl p-6 border border-primary text-on-primary relative overflow-hidden group">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xs font-semibold text-primary-fixed uppercase tracking-wider">Total Revenue</h3>
            <span class="material-symbols-outlined text-secondary-fixed">monitoring</span>
          </div>
          <div class="text-3xl font-bold text-white mb-2" id="kpi-revenue">₹24.1L</div>
          <div class="flex items-center gap-1 text-xs text-secondary-fixed-dim">
            <span class="material-symbols-outlined text-[14px]">trending_up</span>
            <span>Live Vercel Backend</span>
          </div>
        </div>
      </div>

      <div class="bg-surface rounded-xl p-4 border border-outline-variant/60 hover:border-outline-variant transition-colors flex flex-col justify-between cursor-pointer" onclick="window.location.hash='#companies'">
        <h3 class="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">Companies</h3>
        <div class="text-2xl font-bold text-on-background" id="kpi-companies">--</div>
      </div>
      <div class="bg-surface rounded-xl p-4 border border-outline-variant/60 hover:border-outline-variant transition-colors flex flex-col justify-between cursor-pointer" onclick="window.location.hash='#products'">
        <h3 class="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">Products</h3>
        <div class="text-2xl font-bold text-on-background" id="kpi-products">--</div>
      </div>
      <div class="bg-surface rounded-xl p-4 border border-outline-variant/60 hover:border-outline-variant transition-colors flex flex-col justify-between cursor-pointer" onclick="window.location.hash='#quotations'">
        <h3 class="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">Quotations</h3>
        <div class="text-2xl font-bold text-on-background" id="kpi-quotations">--</div>
      </div>
      <div class="bg-surface rounded-xl p-4 border border-outline-variant/60 hover:border-outline-variant transition-colors flex flex-col justify-between cursor-pointer" onclick="window.location.hash='#purchase-orders'">
        <h3 class="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">POs / PIs</h3>
        <div class="text-2xl font-bold text-on-background flex items-baseline gap-1" id="kpi-pos">--</div>
      </div>
    </div>

    <!-- Sales Pipeline -->
    <div class="mb-8">
      <h3 class="text-lg font-bold text-on-background mb-4">Sales Pipeline</h3>
      <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
          <div class="p-4 rounded-lg bg-surface-container-low">
            <div class="w-10 h-10 rounded-full border-2 border-outline-variant mx-auto flex items-center justify-center font-bold text-sm mb-2" id="pipe-draft-count">--</div>
            <p class="text-xs font-semibold uppercase text-on-surface-variant">Draft</p>
          </div>
          <div class="p-4 rounded-lg bg-surface-container-low">
            <div class="w-10 h-10 rounded-full border-2 border-secondary-fixed text-primary mx-auto flex items-center justify-center font-bold text-sm mb-2" id="pipe-sent-count">--</div>
            <p class="text-xs font-semibold uppercase text-primary">Sent</p>
          </div>
          <div class="p-4 rounded-lg bg-secondary-container/30">
            <div class="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container mx-auto flex items-center justify-center font-bold text-sm mb-2" id="pipe-accepted-count">--</div>
            <p class="text-xs font-semibold uppercase text-on-secondary-container">Accepted</p>
          </div>
          <div class="p-4 rounded-lg bg-surface-container-low">
            <div class="w-10 h-10 rounded-full border-2 border-outline-variant mx-auto flex items-center justify-center font-bold text-sm mb-2" id="pipe-po-count">--</div>
            <p class="text-xs font-semibold uppercase text-on-surface-variant">PO Received</p>
          </div>
          <div class="p-4 rounded-lg bg-surface-container-low">
            <div class="w-10 h-10 rounded-full border-2 border-outline-variant mx-auto flex items-center justify-center font-bold text-sm mb-2" id="pipe-pi-count">--</div>
            <p class="text-xs font-semibold uppercase text-on-surface-variant">PI Issued</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Asymmetric Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 bg-surface rounded-xl border border-outline-variant flex flex-col shadow-xs">
        <div class="p-6 border-b border-outline-variant/60 flex justify-between items-center">
          <h3 class="text-base font-bold text-on-background">Recent Quotations</h3>
          <button onclick="window.location.hash='#quotations'" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View All <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low text-xs text-on-surface-variant font-semibold border-b border-outline-variant/60">
                <th class="p-4">Quote ID</th>
                <th class="p-4">Company</th>
                <th class="p-4">Amount</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody id="dashboard-quotations-tbody" class="divide-y divide-outline-variant/30 text-sm">
              ${renderTableSkeleton(5, 3)}
            </tbody>
          </table>
        </div>
      </div>

      <div class="lg:col-span-4 bg-surface rounded-xl border border-outline-variant p-6 flex flex-col shadow-xs">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-error">warning</span>
          <h3 class="text-base font-bold text-on-background">Needs Attention</h3>
        </div>
        <div class="flex flex-col gap-4">
          <div class="p-4 rounded-lg bg-error-container/20 border border-error-container">
            <p class="text-xs font-bold text-error uppercase mb-1">Expiring Soon</p>
            <p class="text-sm text-on-background">Review active quotes approaching validity window.</p>
          </div>
        </div>
      </div>
    </div>
  `,

  quotations: () => `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Quotations</h1>
        <p class="text-sm text-on-surface-variant">Live customer quotes from backend database.</p>
      </div>
      <button onclick="window.location.hash='#new-quotation'" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">add</span>
        <span>New Quotation</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-surface rounded-xl border border-outline-variant p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
        <button class="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold">All</button>
        <button class="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface-variant">Drafts</button>
        <button class="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface-variant">Sent</button>
        <button class="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface-variant">Accepted</button>
      </div>
      <div class="relative w-full md:w-64">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
        <input id="quotations-search-input" type="text" placeholder="Search quotes..." class="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-surface-tint" />
      </div>
    </div>

    <!-- Quotations Data Table -->
    <div class="bg-surface rounded-xl border border-outline-variant shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-xs text-on-surface-variant font-semibold border-b border-outline-variant/60">
              <th class="p-4">Quotation No.</th>
              <th class="p-4">Customer Name</th>
              <th class="p-4">Total Amount</th>
              <th class="p-4">Created Date</th>
              <th class="p-4">Status</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="quotations-tbody" class="divide-y divide-outline-variant/30 text-sm">
            ${renderTableSkeleton(6, 4)}
          </tbody>
        </table>
      </div>
    </div>
  `,

  'new-quotation': () => `
    <div class="flex items-center gap-4 mb-6">
      <button onclick="window.location.hash='#quotations'" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-on-background">Create New Quotation</h1>
        <p class="text-sm text-on-surface-variant">Post new quotation to backend database.</p>
      </div>
    </div>

    <!-- Quotation Form Container -->
    <form id="quotation-form" class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="customerName">Customer Company *</label>
          <input id="customerName" name="customerName" type="text" required placeholder="e.g. ABC Industries Ltd" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-surface-tint" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="quotationDate">Quotation Date *</label>
          <input id="quotationDate" name="quotationDate" type="date" required value="${new Date().toISOString().split('T')[0]}" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-surface-tint" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="contactPerson">Contact Person</label>
          <input id="contactPerson" name="contactPerson" type="text" placeholder="e.g. Rajesh Kumar" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-surface-tint" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="validityDays">Validity (Days)</label>
          <select id="validityDays" name="validityDays" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-surface-tint">
            <option value="15">15 Days</option>
            <option value="30" selected>30 Days</option>
            <option value="60">60 Days</option>
          </select>
        </div>
      </div>

      <!-- Line Items Section -->
      <div class="mb-6 border-t border-outline-variant/60 pt-6">
        <h3 class="text-base font-bold text-on-background mb-4">Line Items</h3>
        <div class="space-y-4" id="quotation-line-items">
          <div class="grid grid-cols-12 gap-3 items-center">
            <div class="col-span-6">
              <input name="itemDescription[]" placeholder="Item description / Product" required class="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm" />
            </div>
            <div class="col-span-2">
              <input name="itemQty[]" type="number" min="1" value="1" placeholder="Qty" required class="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm" />
            </div>
            <div class="col-span-4">
              <input name="itemRate[]" type="number" min="0" placeholder="Rate (₹)" required class="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 border-t border-outline-variant/60 pt-6">
        <button type="button" onclick="window.location.hash='#quotations'" class="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container">Cancel</button>
        <button type="submit" class="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all shadow-xs flex items-center gap-2">
          <span>Save & Generate Quote</span>
        </button>
      </div>
    </form>
  `,

  'quotation-detail': () => `
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <button onclick="window.location.hash='#quotations'" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-on-background" id="detail-quote-id">Quotation Details</h1>
          <p class="text-sm text-on-surface-variant" id="detail-customer-name">Fetching from backend...</p>
        </div>
      </div>
    </div>

    <div class="bg-surface rounded-xl border border-outline-variant p-8 shadow-xs max-w-4xl mx-auto" id="detail-card-container">
      <div class="animate-pulse space-y-4">
        <div class="h-6 bg-surface-container-high rounded w-1/3"></div>
        <div class="h-4 bg-surface-container-high rounded w-1/4"></div>
        <div class="h-40 bg-surface-container-low rounded"></div>
      </div>
    </div>
  `,

  'purchase-orders': () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Purchase Orders</h1>
        <p class="text-sm text-on-surface-variant">Live PO records from database.</p>
      </div>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant shadow-xs overflow-hidden">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-surface-container-low text-xs text-on-surface-variant font-semibold border-b border-outline-variant">
            <th class="p-4">PO Number</th>
            <th class="p-4">Company Name</th>
            <th class="p-4">Total Amount</th>
            <th class="p-4">Status</th>
          </tr>
        </thead>
        <tbody id="po-tbody" class="divide-y divide-outline-variant/30">
          ${renderTableSkeleton(4, 3)}
        </tbody>
      </table>
    </div>
  `,

  'performa-invoices': () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Performa Invoices</h1>
        <p class="text-sm text-on-surface-variant">Manage billing and performa invoices.</p>
      </div>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant shadow-xs overflow-hidden">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-surface-container-low text-xs text-on-surface-variant font-semibold border-b border-outline-variant">
            <th class="p-4">PI Number</th>
            <th class="p-4">Customer</th>
            <th class="p-4">Amount</th>
            <th class="p-4">Status</th>
          </tr>
        </thead>
        <tbody id="pi-tbody" class="divide-y divide-outline-variant/30">
          ${renderTableSkeleton(4, 3)}
        </tbody>
      </table>
    </div>
  `,

  companies: () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Company Directory</h1>
        <p class="text-sm text-on-surface-variant">Client and vendor database.</p>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="companies-container">
      <div class="animate-pulse bg-surface rounded-xl border border-outline-variant p-6 h-36"></div>
      <div class="animate-pulse bg-surface rounded-xl border border-outline-variant p-6 h-36"></div>
      <div class="animate-pulse bg-surface rounded-xl border border-outline-variant p-6 h-36"></div>
    </div>
  `,

  products: () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Products Catalog</h1>
        <p class="text-sm text-on-surface-variant">Live hardware & service items catalog.</p>
      </div>
      <button onclick="window.location.hash='#product-import-workflow'" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">upload_file</span>
        <span>Import Products CSV</span>
      </button>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant shadow-xs overflow-hidden">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-surface-container-low text-xs text-on-surface-variant font-semibold border-b border-outline-variant">
            <th class="p-4">SKU / Code</th>
            <th class="p-4">Product Name</th>
            <th class="p-4">Unit Rate</th>
            <th class="p-4">Category</th>
          </tr>
        </thead>
        <tbody id="products-tbody" class="divide-y divide-outline-variant/30">
          ${renderTableSkeleton(4, 4)}
        </tbody>
      </table>
    </div>
  `,

  reports: () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">Reports & Analytics</h1>
        <p class="text-sm text-on-surface-variant">Live financial and pipeline analytics.</p>
      </div>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs">
      <h3 class="text-base font-bold mb-2">Monthly Revenue & Sales Summary</h3>
      <div id="reports-container" class="p-6 bg-surface-container-low rounded-lg text-on-surface-variant text-sm font-semibold text-center">
        Loading analytics from backend...
      </div>
    </div>
  `,

  'admin-settings': () => `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-on-background">Admin Settings</h1>
      <p class="text-sm text-on-surface-variant">Configure backend parameters and integrations.</p>
    </div>

    <div class="bg-surface rounded-xl border border-outline-variant shadow-xs">
      <div class="flex border-b border-outline-variant px-6 pt-4 gap-6 text-sm font-semibold">
        <button class="pb-3 border-b-2 border-primary text-primary">General Configuration</button>
      </div>
      <form id="settings-form" class="p-6 space-y-6 max-w-2xl">
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="orgName">Organization Name</label>
          <input id="orgName" name="orgName" value="Technicon Services Pvt Ltd" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-2" for="currency">Default Currency</label>
          <select id="currency" name="currency" class="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm">
            <option value="INR" selected>INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
        <button type="submit" class="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container">Save Configuration</button>
      </form>
    </div>
  `,

  'user-management': () => `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-on-background">User Management</h1>
        <p class="text-sm text-on-surface-variant">Manage team members and access permissions.</p>
      </div>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs">
      <p class="text-sm text-on-surface-variant">User permissions active.</p>
    </div>
  `,

  'security-audit-log': () => `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-on-background">Security & Audit Log</h1>
      <p class="text-sm text-on-surface-variant">System access history and API audit trail.</p>
    </div>
    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs">
      <p class="text-sm text-on-surface-variant">All access logs recorded.</p>
    </div>
  `,

  'product-import-workflow': () => `
    <div class="flex items-center gap-4 mb-6">
      <button onclick="window.location.hash='#products'" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-on-background">Import Products - Step 1: Upload File</h1>
        <p class="text-sm text-on-surface-variant">Upload CSV or Excel file containing your product catalog.</p>
      </div>
    </div>

    <div class="bg-surface rounded-xl border-2 border-dashed border-outline-variant p-12 text-center max-w-xl mx-auto cursor-pointer hover:border-primary transition-all">
      <span class="material-symbols-outlined text-[48px] text-primary mb-3">cloud_upload</span>
      <h3 class="text-base font-bold text-on-background mb-1">Drag & Drop Product File Here</h3>
      <p class="text-xs text-on-surface-variant mb-6">Supports .CSV, .XLSX files up to 10MB</p>
      <button onclick="window.location.hash='#product-import-column-mapping'" class="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container">
        Select File & Proceed
      </button>
    </div>
  `,

  'product-import-column-mapping': () => `
    <div class="flex items-center gap-4 mb-6">
      <button onclick="window.location.hash='#product-import-workflow'" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-on-background">Import Products - Step 2: Column Mapping</h1>
        <p class="text-sm text-on-surface-variant">Map CSV columns to Technicon Product fields.</p>
      </div>
    </div>

    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs max-w-2xl">
      <form id="mapping-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 items-center border-b border-outline-variant/40 pb-3">
          <span class="text-sm font-bold">Technicon Field</span>
          <span class="text-sm font-bold">CSV Column</span>
        </div>
        <div class="grid grid-cols-2 gap-4 items-center">
          <label class="text-xs font-semibold">Product Name *</label>
          <select name="map_product_name" class="p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs">
            <option value="Item_Title" selected>CSV Header: Item_Title</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4 items-center">
          <label class="text-xs font-semibold">SKU / Code *</label>
          <select name="map_sku" class="p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs">
            <option value="SKU_Number" selected>CSV Header: SKU_Number</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-outline-variant/60">
          <button type="button" onclick="window.location.hash='#product-import-workflow'" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold">Back</button>
          <button type="button" onclick="window.location.hash='#product-import-validation-preview'" class="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-container">Proceed to Preview ➔</button>
        </div>
      </form>
    </div>
  `,

  'product-import-validation-preview': () => `
    <div class="flex items-center gap-4 mb-6">
      <button onclick="window.location.hash='#product-import-column-mapping'" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-on-background">Import Products - Step 3: Validation & Preview</h1>
        <p class="text-sm text-on-surface-variant">Review extracted products before saving to catalog.</p>
      </div>
    </div>

    <div class="bg-surface rounded-xl border border-outline-variant p-6 shadow-xs">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-bold text-on-background">Extracted Data Preview (Validated)</h3>
        <span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">Ready to Import</span>
      </div>
      <div class="flex justify-end gap-3">
        <button type="button" onclick="window.location.hash='#product-import-column-mapping'" class="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold">Back</button>
        <button type="button" onclick="alert('Products Imported to Database!'); window.location.hash='#products';" class="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container shadow-xs">
          Confirm & Import
        </button>
      </div>
    </div>
  `
};
