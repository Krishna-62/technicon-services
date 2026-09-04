// Technicon Operational ERP Dashboard - Interactive SaaS Engine

document.addEventListener('DOMContentLoaded', () => {
  initNewQuotationModal();
  initDateFilter();
  initAttentionItems();
  initFollowUpRows();
  initProductIntelligenceActions();
  initQuotationsActions();
  initChartTooltips();
  initSpotlightSearch();
  initDrawer();
  initTableStatusFilters();
});

// 1. Chart Data Node Hover Tooltips
function initChartTooltips() {
  const chartWrapper = document.getElementById('revenue-chart-wrapper');
  const tooltip = document.getElementById('chart-tooltip');
  if (!chartWrapper || !tooltip) return;

  const nodes = chartWrapper.querySelectorAll('.chart-node');
  nodes.forEach(node => {
    node.addEventListener('mouseenter', (e) => {
      const month = node.getAttribute('data-month') || '';
      const val = node.getAttribute('data-val') || '';
      tooltip.innerText = `${month}: ${val}`;
      tooltip.classList.remove('opacity-0');
      
      const rect = node.getBoundingClientRect();
      const wrapperRect = chartWrapper.getBoundingClientRect();
      const left = rect.left - wrapperRect.left + rect.width / 2;
      const top = rect.top - wrapperRect.top;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    node.addEventListener('mouseleave', () => {
      tooltip.classList.add('opacity-0');
    });

    node.addEventListener('click', () => {
      const month = node.getAttribute('data-month');
      const val = node.getAttribute('data-val');
      showERPToast(`Inspecting revenue details for ${month}: ${val}`, 'info');
    });
  });
}

// 2. Slide-over Quick Detail Drawer Handler
function initDrawer() {
  const drawer = document.getElementById('detail-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const content = drawer?.querySelector('.drawer-content');
  const closeBtn = document.getElementById('close-drawer-btn');

  if (!drawer || !backdrop || !content) return;

  window.openDetailDrawer = function(data) {
    if (data.title) document.getElementById('drawer-title').innerText = data.title;
    if (data.subtitle) document.getElementById('drawer-subtitle').innerText = data.subtitle;
    if (data.amount) document.getElementById('drawer-amount').innerText = data.amount;
    if (data.status) document.getElementById('drawer-status').innerText = data.status;

    drawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      content.classList.remove('translate-x-full');
    });
  };

  function closeDrawer() {
    backdrop.classList.add('opacity-0');
    content.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 300);
  }

  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  document.getElementById('drawer-action-email')?.addEventListener('click', () => {
    showERPToast('Follow-up reminder email sent to customer!', 'success');
    closeDrawer();
  });

  document.getElementById('drawer-action-edit')?.addEventListener('click', () => {
    showERPToast('Opening proposal editor...', 'info');
    closeDrawer();
  });
}

// 3. Spotlight Command Palette (Cmd+K / Ctrl+K)
function initSpotlightSearch() {
  const spotlightModal = document.getElementById('spotlight-modal');
  const spotlightBackdrop = document.getElementById('spotlight-backdrop');
  const spotlightInput = document.getElementById('spotlight-input');
  const headerTrigger = document.getElementById('header-search-trigger');

  if (!spotlightModal) return;

  function openSpotlight() {
    spotlightModal.classList.remove('hidden');
    spotlightInput?.focus();
  }

  function closeSpotlight() {
    spotlightModal.classList.add('hidden');
  }

  headerTrigger?.addEventListener('click', openSpotlight);
  spotlightBackdrop?.addEventListener('click', closeSpotlight);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (spotlightModal.classList.contains('hidden')) {
        openSpotlight();
      } else {
        closeSpotlight();
      }
    }
    if (e.key === 'Escape' && !spotlightModal.classList.contains('hidden')) {
      closeSpotlight();
    }
  });

  const spotlightItems = spotlightModal.querySelectorAll('.spotlight-item');
  spotlightItems.forEach(item => {
    item.addEventListener('click', () => {
      const text = item.querySelector('span')?.innerText || 'Item';
      showERPToast(`Navigating to: ${text}`, 'info');
      closeSpotlight();
    });
  });
}

// 4. "+ New Quotation" Modal & Form Handling
function initNewQuotationModal() {
  const modal = document.getElementById('new-quotation-modal');
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('new-quotation-form');
  const openBtns = [
    document.getElementById('btn-new-quotation'),
    document.getElementById('hero-quick-quote')
  ];

  if (!modal) return;

  function openModal() {
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  openBtns.forEach(btn => btn?.addEventListener('click', openModal));
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal();
    showERPToast('New Quotation draft successfully created! (Ref: QTN-2026-085)', 'success');
  });

  document.getElementById('hero-export-report')?.addEventListener('click', () => {
    showERPToast('Generating Executive ERP Analytics Report (PDF)...', 'success');
  });

  document.getElementById('kpi-review-btn')?.addEventListener('click', () => {
    showERPToast('Opening Review Queue: 22 proposals pending manager approval', 'warning');
  });
}

// 5. Table Status Filter Pills
function initTableStatusFilters() {
  const filterPills = document.querySelectorAll('.status-filter-pill');
  const rows = document.querySelectorAll('#followups-table-body tr');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => {
        p.className = 'status-filter-pill px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-[#717973] hover:text-[#191c1c] text-xs font-semibold transition-colors';
      });
      pill.className = 'status-filter-pill px-2.5 py-1 rounded-lg bg-[#006d42] text-white text-xs font-bold shadow-2xs';

      const targetStatus = pill.getAttribute('data-status');
      rows.forEach(row => {
        const rowStatus = (row.getAttribute('data-status') || '').toLowerCase();
        if (targetStatus === 'all' || rowStatus === targetStatus) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });
}

// 6. Interactive Attention Items Click
function initAttentionItems() {
  const items = document.querySelectorAll('.attention-item');
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      const qtnId = item.getAttribute('data-qtn-id') || 'QTN-104';
      const company = item.getAttribute('data-company') || 'Customer';
      const amount = item.getAttribute('data-amount') || '₹4.5L';
      const title = item.querySelector('.attention-title')?.innerText || 'Item';

      if (window.openDetailDrawer) {
        window.openDetailDrawer({
          title: company,
          subtitle: `Priority Alert: ${title} (${qtnId})`,
          amount: amount,
          status: 'Action Required'
        });
      } else {
        showERPToast(`Reviewing action item: "${title}"`, 'warning');
      }
    });
  });
}

// 7. Follow Up Table Rows Click
function initFollowUpRows() {
  const rows = document.querySelectorAll('#followups-table-body tr');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const company = row.getAttribute('data-company') || 'Global Tech Inc';
      const amount = row.getAttribute('data-val') || '₹2.4L';
      const status = row.getAttribute('data-status') || 'Sent';

      if (window.openDetailDrawer) {
        window.openDetailDrawer({
          title: company,
          subtitle: `Proposal Details · Technicon Operational ERP`,
          amount: amount,
          status: status
        });
      }
    });
  });
}

// 8. Date Range Dropdown
function initDateFilter() {
  const filterBtn = document.getElementById('date-filter-btn');
  const dropdown = document.getElementById('date-filter-dropdown');

  if (filterBtn && dropdown) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });

    dropdown.querySelectorAll('a').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedText = item.innerText.trim();
        filterBtn.querySelector('span').innerText = selectedText;
        dropdown.classList.add('hidden');
        showERPToast(`Dashboard filter applied: ${selectedText}`, 'info');
      });
    });
  }
}

// 9. Quotations Page Actions
function initQuotationsActions() {
  const exportCsvBtn = document.getElementById('btn-export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      showERPToast('Exporting customer proposals to CSV...', 'success');
    });
  }

  const quoteSearchInput = document.getElementById('quote-search-input');
  if (quoteSearchInput) {
    quoteSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#quotations-table-body tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

// 10. Product Intelligence Page Actions
function initProductIntelligenceActions() {
  const exportBtn = document.getElementById('btn-export-analysis');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showERPToast('Exporting Product Intelligence report (CSV/PDF)...', 'success');
    });
  }
}

// 11. Enterprise Toast Helper Engine
function showERPToast(message, type = 'info') {
  let toastContainer = document.getElementById('erp-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'erp-toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-bold bg-[#002619] text-white border border-[#006d42] transition-all duration-300 transform translate-y-6 opacity-0`;

  let dotColor = 'bg-[#93f4ba]';
  if (type === 'warning') dotColor = 'bg-amber-400';
  if (type === 'success') dotColor = 'bg-emerald-400';

  toast.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full ${dotColor} pulse-indicator"></span>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 text-slate-400 hover:text-white p-1">✕</button>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-6', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
