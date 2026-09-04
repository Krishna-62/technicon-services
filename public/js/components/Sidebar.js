export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: 'shopping_cart' },
  { id: 'performa-invoices', label: 'Performa Invoices', icon: 'receipt_long' },
  { id: 'companies', label: 'Companies', icon: 'business' },
  { id: 'products', label: 'Products', icon: 'inventory_2' },
  { id: 'reports', label: 'Reports', icon: 'assessment' },
  { id: 'admin-settings', label: 'Settings', icon: 'settings' },
  { id: 'user-management', label: 'User Management', icon: 'group' },
  { id: 'security-audit-log', label: 'Security Logs', icon: 'admin_panel_settings' },
];

export function renderSidebar(activeRoute = 'dashboard') {
  return `
    <nav class="hidden md:flex flex-col h-full fixed overflow-y-auto w-64 left-0 top-0 bg-primary dark:bg-primary-container border-r border-outline-variant z-50">
      <!-- Brand Logo Header -->
      <div class="px-6 py-8 flex items-center gap-4 border-b border-outline-variant/20 cursor-pointer" onclick="window.location.hash='#dashboard'">
        <div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-on-secondary-container">business_center</span>
        </div>
        <div>
          <h1 class="font-display-md text-[20px] font-bold text-on-primary dark:text-primary-fixed leading-tight">Technicon</h1>
          <p class="text-on-primary/70 text-[12px] font-medium">Services SaaS Enterprise</p>
        </div>
      </div>

      <!-- Navigation Links -->
      <ul class="flex flex-col py-4 mt-2 gap-1">
        ${navItems.map(item => {
          const isActive = activeRoute === item.id || (item.id === 'products' && activeRoute.startsWith('product-import'));
          const activeClasses = isActive 
            ? 'border-l-4 border-secondary-fixed bg-surface-tint/20 text-on-primary font-bold' 
            : 'border-l-4 border-transparent text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10';
          const iconActiveColor = isActive ? 'text-secondary-fixed' : 'text-on-primary/70';

          return `
            <li>
              <a href="#${item.id}" data-nav="${item.id}" class="flex items-center gap-4 px-6 py-3 ${activeClasses} transition-all duration-150">
                <span class="material-symbols-outlined ${iconActiveColor}">${item.icon}</span>
                <span class="text-[14px]">${item.label}</span>
              </a>
            </li>
          `;
        }).join('')}
      </ul>

      <!-- Footer Quick Status -->
      <div class="mt-auto px-6 py-6 border-t border-outline-variant/20">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-on-primary/5">
          <div class="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse"></div>
          <div>
            <p class="text-[12px] font-semibold text-on-primary">API Service Live</p>
            <p class="text-[11px] text-on-primary/60">v2.4 Enterprise API</p>
          </div>
        </div>
      </div>
    </nav>
  `;
}
