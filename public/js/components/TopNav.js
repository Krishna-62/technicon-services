export function renderTopNav(pageTitle = 'Dashboard') {
  return `
    <header class="flex justify-between items-center h-16 px-6 lg:px-8 w-full bg-surface border-b border-outline-variant sticky top-0 z-40 shadow-xs">
      <div class="flex items-center gap-4 flex-1">
        <button id="mobile-menu-btn" class="md:hidden text-on-surface p-2 rounded-lg hover:bg-surface-container">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="relative w-80 hidden lg:block">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
          <input 
            id="global-search-input"
            type="text" 
            placeholder="Search quotations, POs, companies..." 
            class="w-full pl-10 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-surface-tint focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-on-surface-variant/50"
          />
        </div>
        <h2 class="font-display-md text-lg font-bold text-primary lg:hidden">${pageTitle}</h2>
      </div>

      <div class="flex items-center gap-4">
        <!-- New Quotation Action Button -->
        <button onclick="window.location.hash='#new-quotation'" class="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-all shadow-xs">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>New Quotation</span>
        </button>

        <!-- Import Products Button -->
        <button onclick="window.location.hash='#product-import-workflow'" class="hidden md:flex items-center gap-2 px-3.5 py-1.5 border border-outline-variant text-on-surface rounded-lg text-[13px] font-medium hover:bg-surface-container transition-all">
          <span class="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Import Data</span>
        </button>

        <!-- Notifications Badge -->
        <button class="text-on-surface-variant hover:text-primary transition-colors relative p-2 rounded-full hover:bg-surface-container">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <!-- User Profile Dropdown -->
        <div class="flex items-center gap-3 pl-2 border-l border-outline-variant cursor-pointer group relative" id="user-profile-trigger">
          <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shadow-xs">
            KC
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-[13px] font-semibold text-on-surface leading-tight">Krishna Chaitanya</p>
            <p class="text-[11px] text-on-surface-variant">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  `;
}
