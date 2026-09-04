// Flux AI Control Room - Interactive JavaScript Engine

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initChecklist();
  initQuickActions();
  initTableFilter();
  initLiveStreamSimulator();
  initToastSystem();
});

// 1. Theme Toggle (Dark/Light mode indicator)
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  const htmlEl = document.documentElement;

  if (!themeBtn) return;

  themeBtn.addEventListener('click', () => {
    const isDark = htmlEl.classList.toggle('dark');
    const icon = themeBtn.querySelector('.theme-icon');
    
    if (isDark) {
      if (icon) icon.setAttribute('data-lucide', 'moon');
      showToast('Theme switched to Dark mode', 'info');
    } else {
      if (icon) icon.setAttribute('data-lucide', 'sun');
      showToast('Theme switched to Light mode', 'info');
    }
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
}

// 2. Interactive Getting Started Checklist
function initChecklist() {
  const checkboxes = document.querySelectorAll('.checklist-checkbox');
  const progressBar = document.getElementById('checklist-progress-bar');
  const progressText = document.getElementById('checklist-progress-text');
  const statusBadge = document.getElementById('checklist-status-badge');

  if (!checkboxes.length) return;

  function updateChecklistProgress() {
    const total = checkboxes.length;
    let completed = 0;

    checkboxes.forEach(cb => {
      const parent = cb.closest('.checklist-item');
      const isChecked = cb.dataset.checked === 'true';
      
      if (isChecked) {
        completed++;
        parent.classList.add('opacity-75');
        cb.innerHTML = `<svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
        cb.className = "checklist-checkbox w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400/50 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm";
      } else {
        parent.classList.remove('opacity-75');
        cb.innerHTML = '';
        cb.className = "checklist-checkbox w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 cursor-pointer transition-all duration-200";
      }
    });

    const percent = Math.round((completed / total) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.innerText = `${percent}% Complete`;
    if (statusBadge) statusBadge.innerText = `${completed} of ${total} steps completed`;
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('click', () => {
      const current = cb.dataset.checked === 'true';
      cb.dataset.checked = current ? 'false' : 'true';
      const label = cb.closest('.checklist-item').querySelector('.checklist-label')?.innerText || 'Task';
      updateChecklistProgress();

      if (!current) {
        showToast(`Completed: "${label}"`, 'success');
      }
    });
  });

  // Initial calculation
  updateChecklistProgress();
}

// 3. Quick Action Buttons Event Handlers
function initQuickActions() {
  const actions = [
    { id: 'btn-new-agent', label: 'New Agent Wizard' },
    { id: 'btn-connect-data', label: 'Data Pipeline Connection' },
    { id: 'btn-review-approval', label: 'Pending Approvals Queue' },
    { id: 'btn-view-workspace', label: 'Workspace Switcher' },
    { id: 'btn-launch-demo', label: 'Flux Autonomous Agent Demo' }
  ];

  actions.forEach(act => {
    const btn = document.getElementById(act.id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.add('scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 150);
        showToast(`Triggered: ${act.label}`, act.id === 'btn-launch-demo' ? 'demo' : 'info');
      });
    }
  });
}

// 4. Live Runs Data Table Filtering & Search
function initTableFilter() {
  const searchInput = document.getElementById('dashboard-search-input');
  const tableRows = document.querySelectorAll('#live-runs-table-body tr');

  if (!searchInput || !tableRows.length) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    tableRows.forEach(row => {
      const text = row.innerText.toLowerCase();
      if (text.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
}

// 5. Live Stream Realtime Data Simulation
function initLiveStreamSimulator() {
  const tableBody = document.getElementById('live-runs-table-body');
  if (!tableBody) return;

  // Periodically update latency and timestamps slightly to give a "live control room" feel
  setInterval(() => {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const latencyCell = row.querySelector('.latency-cell');
      const timeCell = row.querySelector('.time-cell');
      const statusBadge = row.querySelector('.status-badge');

      if (latencyCell && statusBadge && statusBadge.innerText.includes('Live')) {
        const currentLatency = parseInt(latencyCell.innerText);
        if (!isNaN(currentLatency)) {
          const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4 ms jitter
          const newLatency = Math.max(45, currentLatency + delta);
          latencyCell.innerText = `${newLatency}ms`;
        }
      }
    });
  }, 4000);
}

// 6. Toast Notification Helper
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-8 opacity-0 glass-card`;

  let iconSvg = '';
  if (type === 'success') {
    toast.classList.add('border-emerald-500/30', 'text-emerald-950', 'dark:text-emerald-200');
    iconSvg = `<div class="p-1.5 rounded-full bg-emerald-500/20 text-emerald-600"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>`;
  } else if (type === 'demo') {
    toast.classList.add('border-amber-500/40', 'bg-amber-500/10', 'text-slate-900', 'dark:text-amber-100');
    iconSvg = `<div class="p-1.5 rounded-full bg-amber-500 text-slate-950"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg></div>`;
  } else {
    toast.classList.add('border-slate-300/50', 'text-slate-800', 'dark:text-slate-100');
    iconSvg = `<div class="p-1.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-300"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-full">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-8', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
