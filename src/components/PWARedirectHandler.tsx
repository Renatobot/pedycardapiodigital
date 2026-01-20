import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Helper para ler do Cache API (compartilhado Safari <-> PWA no iOS)
const getStartUrlFromCacheAPI = async (): Promise<string | null> => {
  if (!('caches' in window)) return null;
  
  try {
    const cache = await caches.open('pedy-pwa-config');
    const response = await cache.match('start-url');
    if (response) {
      const data = await response.json();
      if (data.startUrl && data.startUrl !== '/') {
        console.log('[PWA Redirect] Found URL in Cache API:', data.startUrl);
        return data.startUrl;
      }
    }
  } catch (e) {
    console.log('[PWA Redirect] Cache API error:', e);
  }
  return null;
};

// Helper para pedir ao Service Worker via message
const getStartUrlFromServiceWorker = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      console.log('[PWA Redirect] SW message timeout');
      resolve(null);
    }, 500);

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'START_URL') {
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('message', handler);
        const url = event.data.url;
        if (url && url !== '/') {
          console.log('[PWA Redirect] Found URL from SW message:', url);
          resolve(url);
        } else {
          resolve(null);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    navigator.serviceWorker.controller.postMessage({ type: 'GET_START_URL' });
  });
};

// Helper para ler do IndexedDB
const getStartUrlFromIndexedDB = (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('pedy-pwa', 1);
      
      request.onerror = () => {
        resolve(null);
      };
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('config')) {
          db.close();
          resolve(null);
          return;
        }
        
        const tx = db.transaction('config', 'readonly');
        const store = tx.objectStore('config');
        const getRequest = store.get('start-url');
        
        getRequest.onsuccess = () => {
          db.close();
          const url = getRequest.result;
          if (url && url !== '/') {
            console.log('[PWA Redirect] Found URL in IndexedDB:', url);
            resolve(url);
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      };
    } catch (e) {
      resolve(null);
    }
  });
};

// Detectar tipo de usuário autenticado
const detectUserType = async (userId: string): Promise<'admin' | 'reseller' | 'merchant' | null> => {
  try {
    // Verificar se é admin ou reseller via user_roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userRole?.role === 'admin') {
      console.log('[PWA Redirect] User is admin');
      return 'admin';
    }
    
    if (userRole?.role === 'reseller') {
      console.log('[PWA Redirect] User is reseller');
      return 'reseller';
    }
    
    // Verificar se é reseller pela tabela resellers
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (reseller) {
      console.log('[PWA Redirect] User is reseller (from resellers table)');
      return 'reseller';
    }
    
    // Verificar se é lojista pela tabela establishments
    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (establishment) {
      console.log('[PWA Redirect] User is merchant');
      return 'merchant';
    }
    
    return null;
  } catch (e) {
    console.log('[PWA Redirect] Error detecting user type:', e);
    return null;
  }
};

export function PWARedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const performRedirect = async () => {
      // Verificar se está em modo standalone (PWA instalado) - inclui iOS
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;
      
      console.log('[PWA Redirect] Checking... standalone:', isStandalone, 'path:', location.pathname);
      
      // Só processar se estiver em standalone E na raiz
      if (!isStandalone || location.pathname !== '/') {
        return;
      }

      // Aguardar um pequeno delay para sessão ser restaurada do storage (crítico para iOS)
      await new Promise(resolve => setTimeout(resolve, 500));

      // PRIORIDADE 1: Verificar sessão ativa com retry (para garantir restauração do storage)
      try {
        let session = null;
        let retries = 3;
        
        while (retries > 0 && !session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          
          if (!session) {
            console.log('[PWA Redirect] No session found, retrying...', retries);
            await new Promise(resolve => setTimeout(resolve, 300));
            retries--;
          }
        }
        
        if (session?.user) {
          const userType = await detectUserType(session.user.id);
          
          if (userType === 'admin') {
            console.log('[PWA Redirect] Redirecting admin to /admin/dashboard');
            navigate('/admin/dashboard', { replace: true });
            return;
          }
          
          if (userType === 'reseller') {
            console.log('[PWA Redirect] Redirecting reseller to /revendedor');
            navigate('/revendedor', { replace: true });
            return;
          }
          
          if (userType === 'merchant') {
            console.log('[PWA Redirect] Redirecting merchant to /dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
          
          // Usuário autenticado mas sem role específico - vai pro dashboard
          console.log('[PWA Redirect] Authenticated user without specific role, going to /dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.log('[PWA Redirect] Error checking session:', e);
      }

      // PRIORIDADE 2: Buscar URL salva (para clientes acessando cardápios)
      let redirectUrl: string | null = null;
      let source = '';

      // 2.1 Tentar localStorage primeiro (funciona bem em Android/Desktop)
      redirectUrl = localStorage.getItem('pwa-start-url');
      if (redirectUrl && redirectUrl !== '/') {
        source = 'localStorage';
      }

      // 2.2 Verificar se há um parâmetro na URL (fallback)
      if (!redirectUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        if (returnTo && returnTo !== '/') {
          redirectUrl = returnTo;
          source = 'URL param';
        }
      }

      // 2.3 Verificar sessionStorage como fallback
      if (!redirectUrl) {
        const sessionUrl = sessionStorage.getItem('pwa-last-menu');
        if (sessionUrl && sessionUrl !== '/') {
          redirectUrl = sessionUrl;
          source = 'sessionStorage';
        }
      }

      // 2.4 Tentar Cache API (compartilhado entre Safari e PWA no iOS)
      if (!redirectUrl) {
        redirectUrl = await getStartUrlFromCacheAPI();
        if (redirectUrl) {
          source = 'Cache API';
        }
      }

      // 2.5 Tentar via Service Worker message
      if (!redirectUrl) {
        redirectUrl = await getStartUrlFromServiceWorker();
        if (redirectUrl) {
          source = 'SW message';
        }
      }

      // 2.6 Último fallback: IndexedDB
      if (!redirectUrl) {
        redirectUrl = await getStartUrlFromIndexedDB();
        if (redirectUrl) {
          source = 'IndexedDB';
        }
      }

      // Redirecionar se encontrou uma URL válida
      if (redirectUrl && redirectUrl !== '/' && redirectUrl !== location.pathname) {
        console.log('[PWA Redirect] Redirecting to:', redirectUrl, 'from:', source);
        navigate(redirectUrl, { replace: true });
        return;
      }

      // PRIORIDADE 3: Sem sessão e sem URL salva - sinalizar para mostrar PWAEntryScreen
      console.log('[PWA Redirect] No session or saved URL, setting PWA entry flag');
      localStorage.setItem('pwa-show-entry-screen', 'true');
    };

    performRedirect();
  }, [navigate, location.pathname]);

  return null;
}
