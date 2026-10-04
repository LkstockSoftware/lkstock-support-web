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
  clear: () => localStorage.removeItem('lkstock_access_token')
};
