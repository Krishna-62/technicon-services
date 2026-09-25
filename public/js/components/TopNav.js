export function renderTopNav(pageTitle = 'Dashboard') {
  return `
    <header class="flex justify-between items-center h-16 px-4 md:px-8 w-full bg-[#F4F7F4] border-b border-[#E2E7E3] sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div class="flex items-center gap-4 flex-1">
        <button id="mobile-menu-btn" class="md:hidden text-[#111714] p-2 rounded-lg hover:bg-white border border-[#E2E7E3]">
          <span class="material-symbols-outlined text-[20px]">menu</span>
        </button>
        
        <!-- Search Input matching reference -->
        <div class="relative w-80 hidden sm:block">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#65716B] text-[18px]">search</span>
          <input 
            id="global-search-input"
            type="text" 
            placeholder="Search orders..." 
            class="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E7E3] rounded-full text-xs text-[#111714] placeholder-[#65716B] focus:outline-none focus:ring-2 focus:ring-[#0E513C]/20 focus:border-[#0E513C] transition-all shadow-xs"
          />
        </div>
        <h2 class="font-bold text-base text-[#111714] sm:hidden">${pageTitle}</h2>
      </div>

      <div class="flex items-center gap-4">
        <!-- Notifications Button -->
        <button aria-label="Notifications" class="w-9 h-9 rounded-full bg-white border border-[#E2E7E3] flex items-center justify-center text-[#111714] hover:bg-slate-50 transition-colors shadow-xs relative">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-[#35A866] rounded-full ring-2 ring-white"></span>
        </button>

        <!-- Profile Button -->
        <button aria-label="User Account" class="w-9 h-9 rounded-full bg-white border border-[#E2E7E3] flex items-center justify-center text-[#111714] hover:bg-slate-50 transition-colors shadow-xs">
          <span class="material-symbols-outlined text-[20px]">person</span>
        </button>

        <!-- New Quotation Action Button -->
        <button onclick="window.location.hash='#new-quotation'" class="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#003B2B] text-white rounded-lg text-xs font-semibold hover:bg-[#0E513C] transition-all shadow-xs">
          <span class="material-symbols-outlined text-[16px]">add</span>
          <span>New Quotation</span>
        </button>
      </div>
    </header>
  `;
}

