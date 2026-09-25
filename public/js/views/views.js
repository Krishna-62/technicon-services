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
    <!-- BREADCRUMBS & QUOTATION HEADER ROW (IMAGE 2) -->
    <div class="space-y-2 mb-6">
      <div class="flex items-center gap-2 text-xs text-[#65716B] font-medium">
        <a href="#quotations" class="hover:text-[#0E513C] transition-colors">Quotations</a>
        <span>&gt;</span>
        <span class="text-[#111714] font-bold" id="detail-breadcrumb-id">QTN-104</span>
      </div>

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#111714] tracking-tight" id="detail-heading-id">Quotation QTN-104</h1>
          <span id="detail-status-badge" class="px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#35A866] border border-[#6EE7B7]/40">
            Accepted
          </span>
        </div>
        
        <div class="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button onclick="window.location.hash='#performa-invoices'" class="px-4 py-2 rounded-lg bg-[#003B2B] text-white text-xs font-semibold hover:bg-[#0E513C] transition-colors flex items-center gap-2 shadow-xs">
            <span class="material-symbols-outlined text-[18px]">receipt</span>
            <span>Generate PI</span>
          </button>

          <button onclick="alert('Quotation QTN-104 sent to customer!')" class="px-4 py-2 border border-[#E2E7E3] rounded-lg text-xs font-semibold text-[#111714] bg-white hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs">
            <span class="material-symbols-outlined text-[18px]">send</span>
            <span>Send to Customer</span>
          </button>

          <a href="/api/quotations/104/pdf" target="_blank" class="px-3.5 py-2 border border-[#E2E7E3] rounded-lg text-xs font-semibold text-[#111714] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs">
            <span class="material-symbols-outlined text-[18px]">description</span>
            <span class="hidden sm:inline">PDF</span>
          </a>

          <button aria-label="More options" class="p-2 border border-[#E2E7E3] rounded-lg text-[#65716B] hover:text-[#111714] bg-white hover:bg-slate-50 transition-colors shadow-xs">
            <span class="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4 QUOTATION SUMMARY CARDS (IMAGE 2) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      <div class="bg-white rounded-xl p-5 border border-[#E2E7E3] shadow-xs hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-semibold text-[#65716B]">Total Amount</h3>
          <span class="material-symbols-outlined text-[18px] text-[#65716B]">payments</span>
        </div>
        <div class="text-2xl font-extrabold text-[#111714] mb-1" id="detail-total-amount">₹1,24,500</div>
        <div class="text-[11px] font-medium text-[#65716B]">Excludes 18% Tax</div>
      </div>

      <div class="bg-white rounded-xl p-5 border border-[#E2E7E3] shadow-xs hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-semibold text-[#65716B]">Subtotal & Tax</h3>
          <span class="material-symbols-outlined text-[18px] text-[#65716B]">calculate</span>
        </div>
        <div class="text-2xl font-extrabold text-[#111714] mb-1" id="detail-subtotal-val">₹1,05,500</div>
        <div class="text-[11px] font-medium text-[#65716B]">Tax Amount: ₹19,000</div>
      </div>

      <div class="bg-white rounded-xl p-5 border border-[#E2E7E3] shadow-xs hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-semibold text-[#65716B]">Validity</h3>
          <span class="material-symbols-outlined text-[18px] text-[#65716B]">event_available</span>
        </div>
        <div class="text-2xl font-extrabold text-[#111714] mb-1" id="detail-validity-val">24 Days Left</div>
        <div class="text-[11px] font-semibold text-[#35A866]">Valid until Nov 24, 2026</div>
      </div>

      <div class="bg-white rounded-xl p-5 border border-[#E2E7E3] shadow-xs hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-semibold text-[#65716B]">Line Items</h3>
          <span class="material-symbols-outlined text-[18px] text-[#65716B]">layers</span>
        </div>
        <div class="text-2xl font-extrabold text-[#111714] mb-1" id="detail-item-count">3 Items</div>
        <div class="text-[11px] font-medium text-[#65716B]">Updated 2h ago</div>
      </div>
    </div>

    <!-- MAIN CONTENT 2-COLUMN LAYOUT (70% LINE ITEMS / 30% CUSTOMER & HISTORY) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- LEFT COLUMN -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- LINE ITEMS CARD WITH EDIT BUTTON (IMAGE 2 & 3 TRIGGER) -->
        <div class="bg-white rounded-xl border border-[#E2E7E3] shadow-xs overflow-hidden">
          <div class="p-5 border-b border-[#E2E7E3] flex justify-between items-center bg-white">
            <div class="flex items-center gap-3">
              <h2 class="text-base font-bold text-[#111714]">Line Items</h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F7F4] text-[#65716B] border border-[#E2E7E3]" id="line-item-badge">
                3 Products / Services
              </span>
            </div>

            <!-- EDIT ITEMS BUTTON (TRIGGERS IMAGE 3 MODAL) -->
            <button onclick="document.getElementById('edit-items-modal')?.classList.remove('hidden')" class="px-3.5 py-1.5 border border-[#E2E7E3] rounded-lg text-xs font-semibold text-[#111714] hover:text-[#0E513C] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs">
              <span class="material-symbols-outlined text-[16px] text-[#0E513C]">edit</span>
              <span>Edit Items</span>
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr class="bg-[#F4F7F4]/80 text-[11px] text-[#65716B] font-bold uppercase tracking-wider border-b border-[#E2E7E3]">
                  <th class="py-3 px-5">PRODUCT / DESCRIPTION</th>
                  <th class="py-3 px-5 text-center">QTY</th>
                  <th class="py-3 px-5 text-right">UNIT PRICE</th>
                  <th class="py-3 px-5 text-center">TAX</th>
                  <th class="py-3 px-5 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody id="line-items-tbody" class="divide-y divide-[#E2E7E3] text-xs sm:text-sm">
                <tr class="hover:bg-[#F4F7F4]/60 transition-colors">
                  <td class="py-4 px-5">
                    <div class="font-bold text-[#111714]">Industrial HVAC Unit (Model X-2000)</div>
                    <div class="text-[11px] text-[#65716B] font-medium">SKU: HVAC-X200-BL · Make: Carrier</div>
                  </td>
                  <td class="py-4 px-5 text-center font-semibold text-[#111714]">2</td>
                  <td class="py-4 px-5 text-right font-medium text-[#111714]">₹45,000</td>
                  <td class="py-4 px-5 text-center text-[#65716B]">18%</td>
                  <td class="py-4 px-5 text-right font-bold text-[#111714]">₹90,000</td>
                </tr>
                <tr class="hover:bg-[#F4F7F4]/60 transition-colors">
                  <td class="py-4 px-5">
                    <div class="font-bold text-[#111714]">Installation & Commissioning</div>
                    <div class="text-[11px] text-[#65716B] font-medium">Service Code: SRV-INST-01</div>
                  </td>
                  <td class="py-4 px-5 text-center font-semibold text-[#111714]">1</td>
                  <td class="py-4 px-5 text-right font-medium text-[#111714]">₹12,500</td>
                  <td class="py-4 px-5 text-center text-[#65716B]">0%</td>
                  <td class="py-4 px-5 text-right font-bold text-[#111714]">₹12,500</td>
                </tr>
                <tr class="hover:bg-[#F4F7F4]/60 transition-colors">
                  <td class="py-4 px-5">
                    <div class="font-bold text-[#111714]">Annual Maintenance Contract (1 Year)</div>
                    <div class="text-[11px] text-[#65716B] font-medium">Service Code: AMC-Y1</div>
                  </td>
                  <td class="py-4 px-5 text-center font-semibold text-[#111714]">1</td>
                  <td class="py-4 px-5 text-right font-medium text-[#111714]">₹22,000</td>
                  <td class="py-4 px-5 text-center text-[#65716B]">18%</td>
                  <td class="py-4 px-5 text-right font-bold text-[#111714]">₹22,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card Footer Calculations -->
          <div class="p-5 bg-[#F4F7F4]/40 border-t border-[#E2E7E3] flex justify-end">
            <div class="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
              <div class="flex justify-between text-[#65716B]">
                <span>Subtotal</span>
                <span class="font-semibold text-[#111714]" id="calc-subtotal">₹1,24,500</span>
              </div>
              <div class="flex justify-between text-[#65716B]">
                <span>Tax (18% GST)</span>
                <span class="font-semibold text-[#111714]" id="calc-tax">₹20,160</span>
              </div>
              <div class="pt-2 border-t border-[#E2E7E3] flex justify-between text-base font-extrabold text-[#111714]">
                <span>Grand Total</span>
                <span class="text-[#0E513C]" id="calc-total">₹1,44,660</span>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTES & TERMS CARD -->
        <div class="bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <h2 class="text-base font-bold text-[#111714] border-b border-[#E2E7E3] pb-3">Notes & Terms</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <h3 class="font-bold text-[#111714] uppercase text-[11px] mb-1">Payment Terms</h3>
              <p class="text-[#65716B] leading-relaxed">50% advance upon order confirmation, 50% prior to dispatch.</p>
            </div>
            <div>
              <h3 class="font-bold text-[#111714] uppercase text-[11px] mb-1">Delivery Schedule</h3>
              <p class="text-[#65716B] leading-relaxed">Within 14 working days from receipt of confirmed PO.</p>
            </div>
            <div>
              <h3 class="font-bold text-[#111714] uppercase text-[11px] mb-1">Warranty</h3>
              <p class="text-[#65716B] leading-relaxed">12 months manufacturer warranty against technical defects.</p>
            </div>
            <div>
              <h3 class="font-bold text-[#111714] uppercase text-[11px] mb-1">Other Terms</h3>
              <p class="text-[#65716B] leading-relaxed">Prices valid for 30 days. GST extra as applicable.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- CUSTOMER INFORMATION CARD -->
        <div class="bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <div class="flex justify-between items-center border-b border-[#E2E7E3] pb-3">
            <h2 class="text-base font-bold text-[#111714]">Customer Information</h2>
            <button class="text-xs font-semibold text-[#0E513C] hover:underline">View Profile</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <p class="text-[11px] font-bold text-[#65716B] uppercase">Company Name</p>
              <p class="text-sm font-bold text-[#111714] mt-0.5">Global Tech Inc.</p>
            </div>
            <div>
              <p class="text-[11px] font-bold text-[#65716B] uppercase">Contact Person</p>
              <p class="font-semibold text-[#111714] mt-0.5">Rajesh Kumar <span class="text-[#65716B] font-normal">(Procurement Head)</span></p>
            </div>
            <div>
              <p class="text-[11px] font-bold text-[#65716B] uppercase">Email</p>
              <p class="font-medium text-[#111714] mt-0.5">rajesh.kumar@globaltech.com</p>
            </div>
            <div>
              <p class="text-[11px] font-bold text-[#65716B] uppercase">Phone</p>
              <p class="font-medium text-[#111714] mt-0.5">+91 98765 43210</p>
            </div>
            <div>
              <p class="text-[11px] font-bold text-[#65716B] uppercase">Address</p>
              <p class="text-[#65716B] mt-0.5 leading-relaxed">Plot 42, Tech Park, Phase II, Bengaluru, KA - 560100</p>
            </div>
            <div class="pt-2 flex items-center justify-between border-t border-[#E2E7E3]">
              <span class="text-[11px] font-bold text-[#65716B] uppercase">Customer Health</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#35A866] border border-[#6EE7B7]/40">Active / Strong</span>
            </div>
          </div>
        </div>

        <!-- HISTORY TIMELINE CARD -->
        <div class="bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <div class="flex justify-between items-center border-b border-[#E2E7E3] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#0E513C]">history</span>
              <h2 class="text-base font-bold text-[#111714]">History</h2>
            </div>
          </div>

          <div class="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-[#E2E7E3]">
            <div class="relative">
              <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#35A866] flex items-center justify-center ring-4 ring-white"></span>
              <div class="text-xs leading-relaxed text-[#111714]">
                Quotation <span class="font-bold">QTN-104</span> generated
              </div>
              <div class="text-[11px] text-[#65716B] font-medium mt-0.5">24 Oct 2026, 10:15 AM</div>
            </div>

            <div class="relative">
              <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
              <div class="text-xs leading-relaxed text-[#111714]">
                Viewed internally by <span class="font-bold">Admin</span>
              </div>
              <div class="text-[11px] text-[#65716B] font-medium mt-0.5">24 Oct 2026, 11:30 AM</div>
            </div>

            <div class="relative">
              <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#5178E8] flex items-center justify-center ring-4 ring-white"></span>
              <div class="text-xs leading-relaxed text-[#111714]">
                Status changed to <span class="font-bold text-[#5178E8]">Sent</span> to customer
              </div>
              <div class="text-[11px] text-[#65716B] font-medium mt-0.5">24 Oct 2026, 02:00 PM</div>
            </div>
          </div>
        </div>

        <!-- INTERNAL NOTES CARD -->
        <div class="bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <h2 class="text-base font-bold text-[#111714] border-b border-[#E2E7E3] pb-3">Internal Notes</h2>
          <div class="p-3 bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-xs">
            <p class="text-[#111714] italic leading-normal">"Customer requested 5% discount on bulk AMC. Approved by Sales Manager."</p>
            <div class="mt-2 text-[10px] text-[#65716B] font-medium flex justify-between">
              <span>Sarah J. (Sales Lead)</span>
              <span>Yesterday, 14:30</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,

  'purchase-orders': () => `
    <!-- PAGE TITLE & SUBTITLE HEADER ROW -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#111714] tracking-tight">Purchase Orders</h1>
        <p class="text-xs sm:text-sm text-[#65716B] mt-1">View and manage incoming customer orders.</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Upload PO Button -->
        <button onclick="document.getElementById('upload-po-modal')?.classList.remove('hidden')" class="px-4 py-2 border border-[#E2E7E3] rounded-lg text-xs font-semibold text-[#111714] bg-white hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs">
          <span class="material-symbols-outlined text-[18px] text-[#111714]">upload_file</span>
          <span>Upload PO</span>
        </button>

        <!-- View Reports Button -->
        <button onclick="window.location.hash='#reports'" class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#003B2B] hover:bg-[#0E513C] transition-colors flex items-center gap-2 shadow-xs">
          <span class="material-symbols-outlined text-[18px] text-white">bar_chart</span>
          <span>View Reports</span>
        </button>
      </div>
    </div>

    <!-- THREE METRIC / KPI CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
      <!-- Card 1: Total POs -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Total POs</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-total-pos">1,248</div>
        <div class="flex items-center gap-1 text-xs font-semibold text-[#35A866]">
          <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
          <span>+12% vs last month</span>
        </div>
      </div>

      <!-- Card 2: Pending Approval -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Pending Approval</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-pending-count">42</div>
        <div class="text-xs font-medium text-[#65716B]">
          Requires immediate review
        </div>
      </div>

      <!-- Card 3: Valued At -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Valued At</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-total-value">₹24.8L</div>
        <div class="flex items-center gap-1 text-xs font-semibold text-[#35A866]">
          <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
          <span>+5.4% this quarter</span>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT 2-COLUMN LAYOUT (70% TABLE / 30% ACTIVITY) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- LEFT COLUMN: RECENT PURCHASE ORDERS TABLE (col-span-8) -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-[#E2E7E3] shadow-xs flex flex-col overflow-hidden">
        
        <!-- Table Header Card Title -->
        <div class="p-4 sm:p-5 border-b border-[#E2E7E3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-bold text-[#111714]">Recent Purchase Orders</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F7F4] text-[#65716B] border border-[#E2E7E3]">
              Showing 4 of 4
            </span>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto justify-between">
            <button class="text-xs font-semibold text-[#65716B] hover:text-[#111714] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E7E3] hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
            <button class="text-xs font-semibold text-[#111714] hover:text-[#0E513C] transition-colors flex items-center gap-1">
              <span>View All</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- STATUS FILTER TABS -->
        <div class="p-3 bg-[#F4F7F4] border-b border-[#E2E7E3] overflow-x-auto">
          <div class="flex items-center gap-2 min-w-max">
            <button class="px-3.5 py-1.5 rounded-lg bg-[#003B2B] text-white text-xs font-semibold">
              All Statuses
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Processing
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Completed
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              On Hold
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Pending Approval
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="p-3 bg-white border-b border-[#E2E7E3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div class="relative">
            <span class="material-symbols-outlined text-[16px] text-[#65716B] absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input type="text" placeholder="Search PO or customer..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]" />
          </div>
          <div class="relative">
            <input type="date" class="w-full px-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]" />
          </div>
          <div>
            <select class="w-full px-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]">
              <option value="">All Customers</option>
              <option value="Global Tech Inc.">Global Tech Inc.</option>
              <option value="Nexus Industries">Nexus Industries</option>
              <option value="Vertex Solutions">Vertex Solutions</option>
              <option value="Delta Corp">Delta Corp</option>
            </select>
          </div>
          <div class="flex items-center justify-end">
            <button class="px-3 py-1.5 text-xs font-semibold text-[#65716B] hover:text-[#D44747] border border-[#E2E7E3] rounded-lg transition-colors flex items-center justify-center gap-1 w-full sm:w-auto">
              <span class="material-symbols-outlined text-[14px]">rotate_left</span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        <!-- Table Wrapper -->
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-[#F4F7F4]/80 text-[11px] text-[#65716B] font-bold uppercase tracking-wider border-b border-[#E2E7E3]">
                <th class="py-3 px-5">PO ID / PO NUMBER</th>
                <th class="py-3 px-5">CUSTOMER</th>
                <th class="py-3 px-5 text-right">VALUE</th>
                <th class="py-3 px-5">STATUS</th>
                <th class="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="po-tbody" class="divide-y divide-[#E2E7E3] text-xs sm:text-sm">
              <!-- Row 1 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5">
                  <div class="font-bold text-[#111714]">PO-2024-089</div>
                  <div class="text-[11px] text-[#65716B] font-medium">Ref: QTN-1042 · Oct 24, 2024</div>
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Global Tech Inc.
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹4,50,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D89B23] border border-[#FCD34D]/40">
                    Processing
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </td>
              </tr>

              <!-- Row 2 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5">
                  <div class="font-bold text-[#111714]">PO-2024-088</div>
                  <div class="text-[11px] text-[#65716B] font-medium">Ref: QTN-1039 · Oct 22, 2024</div>
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Nexus Industries
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹12,20,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#35A866] border border-[#6EE7B7]/40">
                    Completed
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </td>
              </tr>

              <!-- Row 3 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5">
                  <div class="font-bold text-[#111714]">PO-2024-087</div>
                  <div class="text-[11px] text-[#65716B] font-medium">Ref: QTN-1045 · Oct 20, 2024</div>
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Vertex Solutions
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹85,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#D44747] border border-[#FCA5A5]/40">
                    On Hold
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </td>
              </tr>

              <!-- Row 4 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5">
                  <div class="font-bold text-[#111714]">PO-2024-086</div>
                  <div class="text-[11px] text-[#65716B] font-medium">Ref: QTN-1011 · Oct 18, 2024</div>
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Delta Corp
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹3,15,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D89B23] border border-[#FCD34D]/40">
                    Processing
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RIGHT COLUMN: RECENT ACTIVITY TIMELINE (col-span-4) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#0E513C]">activity</span>
            <h2 class="text-base font-bold text-[#111714]">Recent Activity</h2>
          </div>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">history</span>
          </button>
        </div>

        <!-- Vertical Timeline with Connecting Line -->
        <div class="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-[#E2E7E3]">
          
          <!-- Timeline Item 1 -->
          <div class="relative">
            <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#35A866] flex items-center justify-center ring-4 ring-white"></span>
            <div class="text-xs leading-relaxed text-[#111714]">
              <span class="font-bold">PO-2024-089</span> received from <span class="font-bold">Global Tech Inc.</span>
            </div>
            <div class="text-[11px] text-[#65716B] font-medium mt-1">2 hours ago</div>
          </div>

          <!-- Timeline Item 2 -->
          <div class="relative">
            <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
            <div class="text-xs leading-relaxed text-[#111714]">
              Status changed to <span class="font-bold text-[#35A866]">Completed</span> for <span class="font-bold">PO-2024-088</span>
            </div>
            <div class="text-[11px] text-[#65716B] font-medium mt-1">5 hours ago</div>
          </div>

          <!-- Timeline Item 3 -->
          <div class="relative">
            <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
            <div class="text-xs leading-relaxed text-[#111714]">
              <span class="font-bold">Sarah J.</span> added a note to <span class="font-bold">PO-2024-087</span>
            </div>
            
            <!-- Quote Callout Box -->
            <div class="mt-2 p-3 bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-xs italic text-[#65716B] leading-normal">
              "Awaiting final confirmation on shipping address before processing."
            </div>

            <div class="text-[11px] text-[#65716B] font-medium mt-2">Yesterday, 14:30</div>
          </div>

          <!-- Timeline Item 4 -->
          <div class="relative">
            <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
            <div class="text-xs leading-relaxed text-[#111714]">
              New PO uploaded manually by <span class="font-bold">Admin</span>
            </div>
            <div class="text-[11px] text-[#65716B] font-medium mt-1">Yesterday, 09:15</div>
          </div>

        </div>
      </div>

    </div>
  `,

  'performa-invoices': () => `
    <!-- PAGE TITLE & SUBTITLE HEADER ROW -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#111714] tracking-tight">Performa Invoices</h1>
        <p class="text-xs sm:text-sm text-[#65716B] mt-1">View and manage performa invoices and customer billing.</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Create PI Button -->
        <button onclick="document.getElementById('create-pi-modal')?.classList.remove('hidden')" class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#003B2B] hover:bg-[#0E513C] transition-colors flex items-center gap-2 shadow-xs">
          <span class="material-symbols-outlined text-[18px] text-white">add</span>
          <span>+ Create PI</span>
        </button>

        <!-- View Reports Button -->
        <button onclick="window.location.hash='#reports'" class="px-4 py-2 border border-[#E2E7E3] rounded-lg text-xs font-semibold text-[#111714] bg-white hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs">
          <span class="material-symbols-outlined text-[18px] text-[#111714]">bar_chart</span>
          <span>View Reports</span>
        </button>
      </div>
    </div>

    <!-- 3 KPI SUMMARY CARDS (Top Summary Area matching wireframe) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
      <!-- Card 1: Total PI -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Total PI</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-total-pi">86</div>
        <div class="flex items-center gap-1 text-xs font-semibold text-[#35A866]">
          <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
          <span>+8% vs last month</span>
        </div>
      </div>

      <!-- Card 2: Pending Approval / Issued -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Pending Approval</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-pending-pi">14</div>
        <div class="text-xs font-medium text-[#65716B]">
          Awaiting customer confirmation
        </div>
      </div>

      <!-- Card 3: Total PI Amount -->
      <div class="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E7E3] shadow-xs relative hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xs sm:text-sm font-semibold text-[#65716B]">Total PI Amount</h3>
          <button class="text-[#65716B] hover:text-[#111714] p-1 rounded">
            <span class="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-[#111714] mb-2" id="kpi-total-amount">₹18.4L</div>
        <div class="flex items-center gap-1 text-xs font-semibold text-[#35A866]">
          <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
          <span>+11.2% this quarter</span>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT 2-COLUMN LAYOUT (70% TABLE / 30% COLLAPSIBLE ACTIVITY) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- LEFT COLUMN: RECENT PERFORMA INVOICES TABLE (col-span-8) -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-[#E2E7E3] shadow-xs flex flex-col overflow-hidden">
        
        <!-- Table Header Card Title -->
        <div class="p-4 sm:p-5 border-b border-[#E2E7E3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-bold text-[#111714]">Recent Performa Invoices</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F7F4] text-[#65716B] border border-[#E2E7E3]">
              Showing 4 of 4
            </span>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto justify-between">
            <button class="text-xs font-semibold text-[#65716B] hover:text-[#111714] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E7E3] hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
            <button class="text-xs font-semibold text-[#111714] hover:text-[#0E513C] transition-colors flex items-center gap-1">
              <span>View All</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- STATUS FILTER TABS -->
        <div class="p-3 bg-[#F4F7F4] border-b border-[#E2E7E3] overflow-x-auto">
          <div class="flex items-center gap-2 min-w-max">
            <button class="px-3.5 py-1.5 rounded-lg bg-[#003B2B] text-white text-xs font-semibold">
              All Statuses
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Issued
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Accepted
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Paid
            </button>
            <button class="px-3.5 py-1.5 rounded-lg bg-white text-[#65716B] hover:text-[#111714] hover:bg-slate-100 text-xs font-semibold border border-[#E2E7E3]">
              Draft
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="p-3 bg-white border-b border-[#E2E7E3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div class="relative">
            <span class="material-symbols-outlined text-[16px] text-[#65716B] absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input type="text" placeholder="Search PI or customer..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]" />
          </div>
          <div class="relative">
            <input type="date" class="w-full px-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]" />
          </div>
          <div>
            <select class="w-full px-3 py-1.5 text-xs bg-[#F4F7F4] border border-[#E2E7E3] rounded-lg text-[#111714] focus:outline-none focus:border-[#0E513C]">
              <option value="">All Customers</option>
              <option value="ABC Industries">ABC Industries</option>
              <option value="TechnoSoft Solutions">TechnoSoft Solutions</option>
              <option value="Global Logistics India">Global Logistics India</option>
              <option value="Apex Buildtech">Apex Buildtech</option>
            </select>
          </div>
          <div class="flex items-center justify-end">
            <button class="px-3 py-1.5 text-xs font-semibold text-[#65716B] hover:text-[#D44747] border border-[#E2E7E3] rounded-lg transition-colors flex items-center justify-center gap-1 w-full sm:w-auto">
              <span class="material-symbols-outlined text-[14px]">rotate_left</span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        <!-- Table Wrapper -->
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr class="bg-[#F4F7F4]/80 text-[11px] text-[#65716B] font-bold uppercase tracking-wider border-b border-[#E2E7E3]">
                <th class="py-3 px-5">PI NUMBER</th>
                <th class="py-3 px-5">CUSTOMER</th>
                <th class="py-3 px-5">REFERENCES</th>
                <th class="py-3 px-5">DATE</th>
                <th class="py-3 px-5 text-right">TOTAL</th>
                <th class="py-3 px-5">STATUS</th>
                <th class="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="pi-tbody" class="divide-y divide-[#E2E7E3] text-xs sm:text-sm">
              <!-- Row 1 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5 font-bold text-[#111714]">
                  PI-2026-024
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  ABC Industries
                </td>
                <td class="py-3.5 px-5 text-[11px] text-[#65716B] font-medium">
                  QTN-105 · PO-204
                </td>
                <td class="py-3.5 px-5 text-xs text-[#65716B]">
                  21 Aug 2026
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹1,24,500
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#5178E8] border border-[#BFDBFE]">
                    Issued
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href="/api/performa-invoices/1/pdf" target="_blank" aria-label="Download PDF" class="p-1.5 text-[#65716B] hover:text-[#0E513C] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </a>
                    <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Row 2 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5 font-bold text-[#111714]">
                  PI-2026-023
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  TechnoSoft Solutions
                </td>
                <td class="py-3.5 px-5 text-[11px] text-[#65716B] font-medium">
                  QTN-102 · PO-201
                </td>
                <td class="py-3.5 px-5 text-xs text-[#65716B]">
                  18 Aug 2026
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹3,45,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#35A866] border border-[#6EE7B7]/40">
                    Accepted
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href="/api/performa-invoices/2/pdf" target="_blank" aria-label="Download PDF" class="p-1.5 text-[#65716B] hover:text-[#0E513C] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </a>
                    <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Row 3 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5 font-bold text-[#111714]">
                  PI-2026-022
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Global Logistics India
                </td>
                <td class="py-3.5 px-5 text-[11px] text-[#65716B] font-medium">
                  QTN-098
                </td>
                <td class="py-3.5 px-5 text-xs text-[#65716B]">
                  15 Aug 2026
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹88,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F7F4] text-[#65716B] border border-[#E2E7E3]">
                    Draft
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href="/api/performa-invoices/3/pdf" target="_blank" aria-label="Download PDF" class="p-1.5 text-[#65716B] hover:text-[#0E513C] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </a>
                    <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Row 4 -->
              <tr class="hover:bg-[#F4F7F4]/60 transition-colors cursor-pointer">
                <td class="py-3.5 px-5 font-bold text-[#111714]">
                  PI-2026-021
                </td>
                <td class="py-3.5 px-5 font-semibold text-[#111714]">
                  Apex Buildtech
                </td>
                <td class="py-3.5 px-5 text-[11px] text-[#65716B] font-medium">
                  QTN-095 · PO-192
                </td>
                <td class="py-3.5 px-5 text-xs text-[#65716B]">
                  10 Aug 2026
                </td>
                <td class="py-3.5 px-5 font-bold text-[#111714] text-right">
                  ₹5,10,000
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#35A866] border border-[#6EE7B7]/40">
                    Paid
                  </span>
                </td>
                <td class="py-3.5 px-5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href="/api/performa-invoices/4/pdf" target="_blank" aria-label="Download PDF" class="p-1.5 text-[#65716B] hover:text-[#0E513C] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </a>
                    <button class="p-1.5 text-[#65716B] hover:text-[#111714] hover:bg-slate-100 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RIGHT COLUMN: COLLAPSIBLE RECENT ACTIVITY SECTION (HANDWRITTEN WIREFRAME POP-DOWN) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-[#E2E7E3] p-5 sm:p-6 shadow-xs flex flex-col h-fit">
        
        <!-- Collapsible Header Control with Downward Arrow -->
        <button 
          id="activity-toggle-btn-spa"
          onclick="
            const content = document.getElementById('activity-content-spa');
            const icon = document.getElementById('activity-icon-spa');
            if (content.style.maxHeight) {
              content.style.maxHeight = null;
              content.style.opacity = '0';
              if (icon) icon.textContent = 'expand_more';
            } else {
              content.style.maxHeight = '500px';
              content.style.opacity = '1';
              if (icon) icon.textContent = 'expand_less';
            }
          " 
          aria-expanded="false" 
          aria-label="Show recent activity"
          class="flex items-center justify-between w-full text-left py-1 group focus:outline-none rounded-lg"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#0E513C]">activity</span>
            <h2 class="text-base font-bold text-[#111714]">Recent Activity</h2>
          </div>
          <div class="flex items-center gap-1 text-xs text-[#65716B] group-hover:text-[#111714]">
            <span class="text-[11px] font-medium hidden sm:inline">Toggle</span>
            <span id="activity-icon-spa" class="material-symbols-outlined text-[20px] text-[#65716B]">expand_more</span>
          </div>
        </button>

        <!-- COLLAPSED BY DEFAULT ACTIVITY CONTAINER -->
        <div id="activity-content-spa" style="max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;">
          <div class="pt-4 border-t border-[#E2E7E3] mt-3">
            <div class="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-[#E2E7E3]">
              
              <div class="relative">
                <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#35A866] flex items-center justify-center ring-4 ring-white"></span>
                <div class="text-xs leading-relaxed text-[#111714]">
                  <span class="font-bold">PI-2026-024</span> generated from QTN-105
                </div>
                <div class="text-[11px] text-[#65716B] font-medium mt-0.5">2 hours ago</div>
              </div>

              <div class="relative">
                <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#5178E8] flex items-center justify-center ring-4 ring-white"></span>
                <div class="text-xs leading-relaxed text-[#111714]">
                  Status changed to <span class="font-bold text-[#5178E8]">Accepted</span> for <span class="font-bold">PI-2026-023</span>
                </div>
                <div class="text-[11px] text-[#65716B] font-medium mt-0.5">5 hours ago</div>
              </div>

              <div class="relative">
                <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
                <div class="text-xs leading-relaxed text-[#111714]">
                  <span class="font-bold">PI-2026-021</span> downloaded by Admin
                </div>
                <div class="text-[11px] text-[#65716B] font-medium mt-0.5">Yesterday, 16:45</div>
              </div>

              <div class="relative">
                <span class="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E2E7E3] flex items-center justify-center ring-4 ring-white"></span>
                <div class="text-xs leading-relaxed text-[#111714]">
                  Performa Invoice draft saved for <span class="font-bold">Global Logistics India</span>
                </div>
                <div class="text-[11px] text-[#65716B] font-medium mt-0.5">15 Aug 2026</div>
              </div>

            </div>
          </div>
        </div>

      </div>

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

  'customer-health': () => `
    <!-- PAGE TITLE & HEADER ACTIONS -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 mb-6">
      <div>
        <h1 class="text-3xl lg:text-4xl font-bold tracking-tight text-[#191c1c]">Customer Health</h1>
        <p class="text-xs lg:text-sm font-medium text-[#717973] mt-1">Monitor client stability, retention, and satisfaction metrics.</p>
      </div>

      <!-- Top Right Action Button (Export Report) -->
      <div>
        <button id="btn-export-report" class="bg-[#002619] hover:bg-[#003e29] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span>Export Report</span>
        </button>
      </div>
    </div>

    <!-- ROW 1: 4 KPI CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      <!-- KPI 1: Overall Health Score -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <div class="flex items-center justify-between text-[#717973]">
          <span class="text-xs font-semibold">Overall Health Score</span>
          <span class="material-symbols-outlined text-[18px] cursor-pointer">more_vert</span>
        </div>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">84<span class="text-base text-[#717973] font-normal">/100</span></div>
          <div class="flex items-center gap-1 text-xs font-medium text-[#006d42] mt-1">
            <span class="material-symbols-outlined text-[16px]">trending_up</span>
            <span>+2.4% vs last month</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Retention Rate -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <div class="flex items-center justify-between text-[#717973]">
          <span class="text-xs font-semibold">Retention Rate</span>
          <span class="material-symbols-outlined text-[18px] cursor-pointer">more_vert</span>
        </div>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">96.2%</div>
          <div class="text-xs font-medium text-[#717973] mt-1">— Steady</div>
        </div>
      </div>

      <!-- KPI 3: At-Risk Accounts -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <div class="flex items-center justify-between text-[#717973]">
          <span class="text-xs font-semibold">At-Risk Accounts</span>
          <span class="material-symbols-outlined text-[18px] cursor-pointer">more_vert</span>
        </div>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#dc2626] tracking-tight">8</div>
          <div class="flex items-center gap-1 text-xs font-medium text-[#dc2626] mt-1">
            <span class="material-symbols-outlined text-[16px]">trending_down</span>
            <span>-2 from last week</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: NPS Score -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <div class="flex items-center justify-between text-[#717973]">
          <span class="text-xs font-semibold">NPS Score</span>
          <span class="material-symbols-outlined text-[18px] cursor-pointer">more_vert</span>
        </div>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">72</div>
          <div class="flex items-center gap-1 text-xs font-medium text-[#006d42] mt-1">
            <span class="material-symbols-outlined text-[16px]">trending_up</span>
            <span>+5 pts</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ROW 2: CHARTS (Health Trend Over Time & Sentiment Distribution) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      
      <!-- Left Chart: Health Trend Over Time (8 cols) -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-6 shadow-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-base font-bold text-[#191c1c]">Health Trend Over Time</h2>
            <!-- Legend -->
            <div class="flex items-center gap-3 text-xs font-medium text-[#717973]">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#002619]"></span> Health</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#006d42]"></span> Engagement</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#8ee84f]"></span> Sentiment</span>
            </div>
          </div>
          <span class="material-symbols-outlined text-[18px] text-[#717973] cursor-pointer">more_vert</span>
        </div>

        <!-- Multi-series Trend Lines Chart SVG -->
        <div class="w-full h-64 relative flex">
          <!-- Y-Axis Scale -->
          <div class="flex flex-col justify-between text-[11px] font-medium text-[#717973] pr-3 py-1 select-none">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          <!-- Main Chart Canvas -->
          <div class="flex-1 flex flex-col justify-between relative overflow-visible">
            <!-- Grid Lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#eceeed]"></div>
            </div>

            <!-- SVG Multi-Line Curves -->
            <svg class="w-full h-full overflow-visible relative z-10" viewBox="0 0 500 200" preserveAspectRatio="none">
              <!-- Series 1: Health (Dark Green #002619) -->
              <path d="M 0 85 Q 100 70, 200 100 T 350 40 T 500 25" fill="none" stroke="#002619" stroke-width="4" stroke-linecap="round" />
              
              <!-- Series 2: Engagement (Medium Green #006d42) -->
              <path d="M 0 110 Q 100 95, 200 85 T 350 75 T 500 45" fill="none" stroke="#006d42" stroke-width="4" stroke-linecap="round" />

              <!-- Series 3: Sentiment (Lime Green #8ee84f) -->
              <path d="M 0 90 Q 100 120, 200 80 T 350 70 T 500 40" fill="none" stroke="#8ee84f" stroke-width="4" stroke-linecap="round" />
            </svg>

            <!-- X-Axis Labels -->
            <div class="flex items-center justify-between text-xs font-medium text-[#717973] pt-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Chart: Sentiment Distribution Donut (4 cols) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-4 shadow-xs">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-[#191c1c]">Sentiment Distribution</h2>
          <span class="material-symbols-outlined text-[18px] text-[#717973] cursor-pointer">more_vert</span>
        </div>

        <!-- Donut Ring Chart with Center Text -->
        <div class="relative flex items-center justify-center my-2">
          <svg class="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <!-- Segment 1: Positive (Green - 60%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#35A866" stroke-width="14" stroke-dasharray="143 239" stroke-dashoffset="0" />

            <!-- Segment 2: Neutral (Orange/Amber - 25%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" stroke-width="14" stroke-dasharray="60 239" stroke-dashoffset="-144" />

            <!-- Segment 3: Negative (Red - 15%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" stroke-width="14" stroke-dasharray="36 239" stroke-dashoffset="-204" />
          </svg>
          <div class="absolute flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-extrabold text-[#191c1c]">60%</span>
            <span class="text-[11px] font-semibold text-[#717973]">Positive</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-col gap-2 border-t border-[#eceeed] pt-3 text-xs font-semibold">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#35A866]"></span>
              <span class="text-[#191c1c]">Positive</span>
            </div>
            <span class="font-bold text-[#717973]">60%</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
              <span class="text-[#191c1c]">Neutral</span>
            </div>
            <span class="font-bold text-[#717973]">25%</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
              <span class="text-[#191c1c]">Negative</span>
            </div>
            <span class="font-bold text-[#717973]">15%</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ROW 3: CUSTOMER HEALTH MATRIX DATA TABLE -->
    <div class="bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-4 shadow-xs">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-[#191c1c]">Customer Health Matrix</h2>
        <button class="px-3 py-1.5 border border-[#e1e3e2] rounded-lg text-xs font-semibold text-[#191c1c] bg-white hover:bg-slate-50 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">tune</span>
          <span>Filter</span>
        </button>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eceeed] text-[11px] font-bold text-[#717973] uppercase tracking-wider">
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Health Score</th>
              <th class="py-3 px-4">Last Activity</th>
              <th class="py-3 px-4">Engagement</th>
              <th class="py-3 px-4 text-center">Sentiment</th>
              <th class="py-3 px-4 text-center">Trend</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eceeed] text-xs font-medium">
            
            <!-- Row 1: Acme Corp -->
            <tr class="hover:bg-[#f8faf9] transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c] flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-[#002619] text-[#93f4ba] text-[11px] font-bold flex items-center justify-center">AC</span>
                <span>Acme Corp</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">92 - Excellent</span>
              </td>
              <td class="py-3.5 px-4 text-[#717973]">2 hours ago</td>
              <td class="py-3.5 px-4">
                <div class="w-24 bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#002619] h-full w-[90%]"></div>
                </div>
              </td>
              <td class="py-3.5 px-4 text-center text-emerald-600 font-bold text-base">😊</td>
              <td class="py-3.5 px-4 text-center text-emerald-600 font-bold">↑</td>
              <td class="py-3.5 px-4 text-right">
                <button class="p-1 hover:bg-slate-100 rounded text-[#717973]"><span class="material-symbols-outlined text-[18px]">more_horiz</span></button>
              </td>
            </tr>

            <!-- Row 2: Global Tech -->
            <tr class="hover:bg-[#f8faf9] transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c] flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-slate-200 text-[#191c1c] text-[11px] font-bold flex items-center justify-center">GT</span>
                <span>Global Tech</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">68 - Fair</span>
              </td>
              <td class="py-3.5 px-4 text-[#717973]">1 day ago</td>
              <td class="py-3.5 px-4">
                <div class="w-24 bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full w-[60%]"></div>
                </div>
              </td>
              <td class="py-3.5 px-4 text-center text-amber-500 font-bold text-base">😐</td>
              <td class="py-3.5 px-4 text-center text-amber-500 font-bold">—</td>
              <td class="py-3.5 px-4 text-right">
                <button class="p-1 hover:bg-slate-100 rounded text-[#717973]"><span class="material-symbols-outlined text-[18px]">more_horiz</span></button>
              </td>
            </tr>

            <!-- Row 3: Stark Industries -->
            <tr class="hover:bg-[#f8faf9] transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c] flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-slate-200 text-[#191c1c] text-[11px] font-bold flex items-center justify-center">SI</span>
                <span>Stark Industries</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">42 - Critical</span>
              </td>
              <td class="py-3.5 px-4 text-[#717973]">5 days ago</td>
              <td class="py-3.5 px-4">
                <div class="w-24 bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                  <div class="bg-rose-500 h-full w-[35%]"></div>
                </div>
              </td>
              <td class="py-3.5 px-4 text-center text-rose-600 font-bold text-base">🙁</td>
              <td class="py-3.5 px-4 text-center text-rose-600 font-bold">↓</td>
              <td class="py-3.5 px-4 text-right">
                <button class="p-1 hover:bg-slate-100 rounded text-[#717973]"><span class="material-symbols-outlined text-[18px]">more_horiz</span></button>
              </td>
            </tr>

            <!-- Row 4: Wayne Inc. -->
            <tr class="hover:bg-[#f8faf9] transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c] flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-[#002619] text-[#93f4ba] text-[11px] font-bold flex items-center justify-center">WI</span>
                <span>Wayne Inc.</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">88 - Good</span>
              </td>
              <td class="py-3.5 px-4 text-[#717973]">4 hours ago</td>
              <td class="py-3.5 px-4">
                <div class="w-24 bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#002619] h-full w-[85%]"></div>
                </div>
              </td>
              <td class="py-3.5 px-4 text-center text-emerald-600 font-bold text-base">😊</td>
              <td class="py-3.5 px-4 text-center text-emerald-600 font-bold">↑</td>
              <td class="py-3.5 px-4 text-right">
                <button class="p-1 hover:bg-slate-100 rounded text-[#717973]"><span class="material-symbols-outlined text-[18px]">more_horiz</span></button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  `,

  'product-intelligence': () => `
    <!-- PAGE TITLE & HEADER ACTIONS -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 mb-6">
      <div>
        <h1 class="text-3xl lg:text-4xl font-bold tracking-tight text-[#191c1c]">Product Intelligence</h1>
        <p class="text-xs lg:text-sm font-medium text-[#717973] mt-1">Data-driven insights into product performance and market demand.</p>
      </div>

      <!-- Top Right Action Buttons (Export Analysis & Add Product) -->
      <div class="flex items-center gap-3">
        <button id="btn-export-analysis" class="bg-white border border-[#e1e3e2] hover:border-[#c0c9c2] text-[#191c1c] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all hover:bg-slate-50">
          Export Analysis
        </button>
        
        <button id="btn-add-product" onclick="window.location.hash='#products'" class="bg-[#002619] hover:bg-[#003e29] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
          <span>Add Product</span>
        </button>
      </div>
    </div>

    <!-- ROW 1: 4 KPI CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      <!-- KPI 1: Top Selling Product -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <span class="text-xs font-semibold text-[#717973]">Top Selling Product</span>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">₹84.5L</div>
          <div class="text-xs font-medium text-[#717973] mt-1">Industrial HVAC Unit</div>
        </div>
      </div>

      <!-- KPI 2: Inventory Value -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <span class="text-xs font-semibold text-[#717973]">Inventory Value</span>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">₹4.2Cr</div>
          <div class="flex items-center gap-1 text-xs font-medium text-[#006d42] mt-1">
            <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>+5.1% vs last month</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Low Stock Alerts -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all relative">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-[#717973]">Low Stock Alerts</span>
          <span class="material-symbols-outlined text-[18px] text-[#ba1a1a]">warning</span>
        </div>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">12</div>
          <div class="text-xs font-medium text-[#717973] mt-1">Items below threshold</div>
        </div>
      </div>

      <!-- KPI 4: Average Margin -->
      <div class="bg-white rounded-xl border border-[#e1e3e2] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all">
        <span class="text-xs font-semibold text-[#717973]">Average Margin</span>
        <div>
          <div class="text-2xl lg:text-3xl font-extrabold text-[#191c1c] tracking-tight">34.2%</div>
          <div class="flex items-center gap-1 text-xs font-medium text-[#006d42] mt-1">
            <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>+1.2% overall</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ROW 2: MIDDLE ROW WIDGETS (Product Revenue Performance & Category Distribution) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      
      <!-- Product Revenue Performance Line Chart Card (Left - 8 columns) -->
      <div class="lg:col-span-8 bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-6 shadow-xs">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-[#191c1c]">Product Revenue Performance</h2>
          <button class="text-[#717973] hover:text-[#191c1c] font-bold">•••</button>
        </div>

        <!-- Line Chart SVG with Data Nodes & Y-Axis Scale -->
        <div class="w-full h-64 relative flex">
          <!-- Y-Axis Labels -->
          <div class="flex flex-col justify-between text-[11px] font-medium text-[#717973] pr-3 py-1 select-none">
            <span>90</span>
            <span>80</span>
            <span>70</span>
            <span>60</span>
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          <!-- Main Chart Area -->
          <div class="flex-1 flex flex-col justify-between relative overflow-visible">
            
            <!-- Horizontal Grid Lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#f2f4f3]"></div>
              <div class="w-full border-b border-[#eceeed]"></div>
            </div>

            <!-- SVG Line Curve + Area Gradient + Nodes -->
            <svg class="w-full h-full overflow-visible relative z-10" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="productLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#006d42" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#006d42" stop-opacity="0.02" />
                </linearGradient>
              </defs>

              <!-- Area Fill -->
              <path d="M 0 100 Q 100 80, 200 90 T 350 40 T 500 15 L 500 200 L 0 200 Z" fill="url(#productLineGrad)" />
              
              <!-- Line Curve -->
              <path d="M 0 100 Q 100 80, 200 90 T 350 40 T 500 15" fill="none" stroke="#002619" stroke-width="3" stroke-linecap="round" />

              <!-- Data Node Circles -->
              <circle cx="0" cy="100" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
              <circle cx="100" cy="85" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
              <circle cx="200" cy="95" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
              <circle cx="300" cy="55" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
              <circle cx="400" cy="40" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
              <circle cx="500" cy="15" r="4.5" fill="#ffffff" stroke="#002619" stroke-width="2.5" class="hover:r-6 transition-all" />
            </svg>

            <!-- X-Axis Labels -->
            <div class="flex items-center justify-between text-xs font-medium text-[#717973] pt-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Distribution Donut Chart Card (Right - 4 columns) -->
      <div class="lg:col-span-4 bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-5 shadow-xs">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-[#191c1c]">Category Distribution</h2>
          <button class="text-[#717973] hover:text-[#191c1c] font-bold">•••</button>
        </div>

        <!-- Donut Ring Chart SVG -->
        <div class="relative flex items-center justify-center my-2">
          <svg class="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <!-- Segment 1: HVAC (Dark Green #002619 - 48%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#002619" stroke-width="16" stroke-dasharray="114 239" stroke-dashoffset="0" />

            <!-- Segment 2: Electrical (Forest Green #006d42 - 26%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#006d42" stroke-width="16" stroke-dasharray="62 239" stroke-dashoffset="-115" />

            <!-- Segment 3: Service (Mint Green #93f4ba - 16%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#93f4ba" stroke-width="16" stroke-dasharray="38 239" stroke-dashoffset="-178" />

            <!-- Segment 4: Hardware (Soft Muted Green #76a891 - 10%) -->
            <circle cx="50" cy="50" r="38" fill="none" stroke="#76a891" stroke-width="16" stroke-dasharray="24 239" stroke-dashoffset="-217" />
          </svg>
        </div>

        <!-- Legend Breakdown Grid -->
        <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-[#191c1c] border-t border-[#eceeed] pt-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#002619]"></span>
            <span>HVAC</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#006d42]"></span>
            <span>Electrical</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#93f4ba]"></span>
            <span>Service</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#76a891]"></span>
            <span>Hardware</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ROW 3: PRODUCT PERFORMANCE MATRIX DATA TABLE (Full Width) -->
    <div class="bg-white rounded-xl border border-[#e1e3e2] p-6 flex flex-col justify-between gap-4 shadow-xs">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-[#191c1c]">Product Performance Matrix</h2>
        <button class="p-2 rounded-xl text-[#717973] hover:text-[#191c1c] hover:bg-[#f8faf9] transition-colors">
          <span class="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      <!-- Matrix Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eceeed] text-[11px] font-bold text-[#717973] uppercase tracking-wider">
              <th class="py-3 px-4">PRODUCT NAME</th>
              <th class="py-3 px-4">SKU</th>
              <th class="py-3 px-4">CATEGORY</th>
              <th class="py-3 px-4 text-right">UNITS SOLD</th>
              <th class="py-3 px-4 text-right">REVENUE</th>
              <th class="py-3 px-4 text-right">MARGIN</th>
              <th class="py-3 px-4 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody id="product-matrix-table-body" class="divide-y divide-[#eceeed] text-xs font-medium">
            
            <!-- Row 1: Industrial HVAC -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">Industrial HVAC</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">HVAC-X200-BL</td>
              <td class="py-3.5 px-4 text-[#191c1c]">HVAC</td>
              <td class="py-3.5 px-4 text-right font-mono">42</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹35.2L</td>
              <td class="py-3.5 px-4 text-right font-medium">38%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">
                  In Stock
                </span>
              </td>
            </tr>

            <!-- Row 2: Control Panel -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">Control Panel</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">ELEC-CB-01</td>
              <td class="py-3.5 px-4 text-[#191c1c]">Electrical</td>
              <td class="py-3.5 px-4 text-right font-mono">156</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹28.4L</td>
              <td class="py-3.5 px-4 text-right font-medium">24%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                  Low Stock
                </span>
              </td>
            </tr>

            <!-- Row 3: Chiller Unit 500 -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">Chiller Unit 500</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">HVAC-CH-50</td>
              <td class="py-3.5 px-4 text-[#191c1c]">HVAC</td>
              <td class="py-3.5 px-4 text-right font-mono">18</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹19.8L</td>
              <td class="py-3.5 px-4 text-right font-medium">42%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">
                  In Stock
                </span>
              </td>
            </tr>

            <!-- Row 4: Smart Meter Pro -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">Smart Meter Pro</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">ELEC-SM-99</td>
              <td class="py-3.5 px-4 text-[#191c1c]">Electrical</td>
              <td class="py-3.5 px-4 text-right font-mono">210</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹14.5L</td>
              <td class="py-3.5 px-4 text-right font-medium">31%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">
                  In Stock
                </span>
              </td>
            </tr>

            <!-- Row 5: HVAC Filter Pack -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">HVAC Filter Pack</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">SERV-FP-04</td>
              <td class="py-3.5 px-4 text-[#191c1c]">Service</td>
              <td class="py-3.5 px-4 text-right font-mono">340</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹6.2L</td>
              <td class="py-3.5 px-4 text-right font-medium">55%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e6f7ef] text-[#006d42]">
                  In Stock
                </span>
              </td>
            </tr>

            <!-- Row 6: Copper Valve 2" -->
            <tr class="hover:bg-[#f8faf9] cursor-pointer transition-colors">
              <td class="py-3.5 px-4 font-bold text-[#191c1c]">Copper Valve 2"</td>
              <td class="py-3.5 px-4 text-[#717973] font-mono">HARD-CV-20</td>
              <td class="py-3.5 px-4 text-[#191c1c]">Hardware</td>
              <td class="py-3.5 px-4 text-right font-mono">85</td>
              <td class="py-3.5 px-4 text-right font-bold text-[#191c1c]">₹2.1L</td>
              <td class="py-3.5 px-4 text-right font-medium">19%</td>
              <td class="py-3.5 px-4 text-right">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                  Low Stock
                </span>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
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
