import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function PWARedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se está em modo standalone (PWA instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone && location.pathname === '/') {
      const savedStartUrl = localStorage.getItem('pwa-start-url');
      
      if (savedStartUrl && savedStartUrl !== '/') {
        // Redirecionar para a URL salva durante a instalação
        navigate(savedStartUrl, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
}
