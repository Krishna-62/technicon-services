export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error-toast' : ''}`;
  
  const iconName = type === 'error' ? 'error' : 'check_circle';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[24px]">${iconName}</span>
    <div class="flex-1">
      <p class="text-[13px] font-semibold">${type === 'error' ? 'Action Failed' : 'API Action Triggered'}</p>
      <p class="text-[12px] opacity-90">${message}</p>
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto hide after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
