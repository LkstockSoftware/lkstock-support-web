window.lkstockAuth = {
  captureFromUrl: () => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('access_token');
    if (token) {
      localStorage.setItem('lkstock_access_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return token || localStorage.getItem('lkstock_access_token');
  },
  store: (token) => localStorage.setItem('lkstock_access_token', token),
  clear: () => localStorage.removeItem('lkstock_access_token')
};

window.lkstockUi = {
  getBuildInfo: async () => {
    try {
      const response = await fetch(`/build-info.json?t=${Date.now()}`, { cache: 'no-store' });
      return response.ok ? await response.json() : null;
    } catch { return null; }
  },
  success: (title, text) => Swal.fire({ icon: 'success', title, text, confirmButtonText: 'Entendido', confirmButtonColor: '#1676ac' }),
  error: (title, text) => Swal.fire({ icon: 'error', title, text, confirmButtonText: 'Entendido', confirmButtonColor: '#b84f59' }),
  confirm: async (title, text, confirmButtonText = 'Sí, continuar') => {
    const result = await Swal.fire({
      icon: 'question', title, text, showCancelButton: true,
      confirmButtonText, cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1676ac', cancelButtonColor: '#6d7c89',
      reverseButtons: true, focusCancel: true
    });
    return result.isConfirmed;
  }
};