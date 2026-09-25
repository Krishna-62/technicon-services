export const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: 'shopping_cart' },
  { id: 'performa-invoices', label: 'Performa Invoices', icon: 'receipt_long' },
  { id: 'companies', label: 'Companies', icon: 'business' },
  { id: 'products', label: 'Products', icon: 'inventory_2' }
];

export const reportsNavItems = [
  { id: 'reports', label: 'Business Health', icon: 'trending_up' },
  { id: 'customer-health', label: 'Customer Health', icon: 'group' },
  { id: 'growth-opportunities', label: 'Growth Opportunities', icon: 'explore' },
  { id: 'product-intelligence', label: 'Product Intelligence', icon: 'psychology' },
  { id: 'ai-chat', label: 'Chat with AI', icon: 'chat' }
];

export const systemNavItems = [
  { id: 'admin-settings', label: 'Settings', icon: 'settings' },
  { id: 'user-management', label: 'Admin', icon: 'verified_user' }
];

export function renderSidebar(activeRoute = 'dashboard') {
  const renderItem = (item) => {
    const isActive = activeRoute === item.id || (item.id === 'products' && activeRoute.startsWith('product-import'));
    const activeClasses = isActive 
      ? 'border-l-4 border-[#9CF45D] bg-[#0E513C] text-white font-semibold' 
      : 'border-l-4 border-transparent text-slate-300 hover:text-white hover:bg-white/5';
    const iconColor = isActive ? 'text-white' : 'text-slate-400';

    const href = `#${item.id}`;

    return `
      <li>
        <a href="${href}" data-nav="${item.id}" class="flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-xs ${activeClasses} transition-all duration-150">
          <span class="material-symbols-outlined text-[18px] ${iconColor}">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      </li>
    `;
  };

  return `
    <aside class="hidden md:flex flex-col h-full fixed overflow-y-auto w-64 left-0 top-0 bg-[#003B2B] text-white border-r border-[#0E513C]/40 z-50 p-4 justify-between">
      <div class="flex flex-col gap-5">
        <!-- Brand Logo Header -->
        <div class="px-2 pt-2 flex items-center justify-between cursor-pointer" onclick="window.location.hash='#dashboard'">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#0E513C] flex items-center justify-center text-[#9CF45D] border border-[#9CF45D]/20 shadow-xs">
              <span class="material-symbols-outlined text-[20px]">layers</span>
            </div>
            <div>
              <h1 class="text-lg font-extrabold tracking-tight text-white leading-none">TECHNICON</h1>
              <p class="text-[11px] font-semibold text-slate-300 mt-1 tracking-wide">Operational ERP</p>
            </div>
          </div>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0E513C] text-[#9CF45D] border border-[#9CF45D]/30">PRO</span>
        </div>

        <!-- Navigation Links -->
        <ul class="flex flex-col gap-1 mt-2">
          ${mainNavItems.map(renderItem).join('')}
        </ul>

        <!-- Reports Group -->
        <div class="pt-3 pb-1 px-2">
          <span class="text-[10px] font-extrabold tracking-wider text-emerald-400/70 uppercase">REPORTS & INSIGHTS</span>
        </div>
        <ul class="flex flex-col gap-1">
          ${reportsNavItems.map(renderItem).join('')}
        </ul>

        <!-- System Group -->
        <div class="pt-3 pb-1 px-2">
          <span class="text-[10px] font-extrabold tracking-wider text-emerald-400/70 uppercase">SYSTEM</span>
        </div>
        <ul class="flex flex-col gap-1">
          ${systemNavItems.map(renderItem).join('')}
        </ul>
      </div>

      <!-- User Profile Footer -->
      <div class="pt-4 border-t border-[#0E513C]/60 flex items-center justify-between px-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#0E513C] text-[#9CF45D] font-bold text-xs flex items-center justify-center border border-[#9CF45D]/30">
            KC
          </div>
          <div class="text-left">
            <p class="text-xs font-semibold text-white leading-tight">Krishna C.</p>
            <p class="text-[10px] text-slate-400">Administrator</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-[18px] text-slate-400 hover:text-white cursor-pointer">logout</span>
      </div>
    </aside>
  `;
}

