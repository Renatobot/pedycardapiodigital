import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function PWARedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se está em modo standalone (PWA instalado) - inclui iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    
    if (isStandalone && location.pathname === '/') {
      let redirectUrl: string | null = null;

      // 1. Tentar localStorage primeiro
      redirectUrl = localStorage.getItem('pwa-start-url');

      // 2. Verificar se há um parâmetro na URL (fallback)
      if (!redirectUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        if (returnTo) {
          redirectUrl = returnTo;
        }
      }

      // 3. Verificar sessionStorage como último fallback
      if (!redirectUrl) {
        redirectUrl = sessionStorage.getItem('pwa-last-menu');
      }

      // 4. Tentar recuperar do IndexedDB (mais persistente no iOS)
      if (!redirectUrl) {
        try {
          const request = indexedDB.open('pedy-pwa', 1);
          request.onsuccess = () => {
            const db = request.result;
            if (db.objectStoreNames.contains('config')) {
              const tx = db.transaction('config', 'readonly');
              const store = tx.objectStore('config');
              const getRequest = store.get('start-url');
              getRequest.onsuccess = () => {
                if (getRequest.result && getRequest.result !== '/') {
                  navigate(getRequest.result, { replace: true });
                }
              };
            }
            db.close();
          };
        } catch (e) {
          // IndexedDB não disponível, ignorar
        }
      }

      if (redirectUrl && redirectUrl !== '/') {
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
}
