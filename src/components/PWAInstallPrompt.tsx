import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, MoreVertical, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detectar iOS (qualquer navegador)
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         !(window as any).MSStream;
};

// Detectar se é Safari no iOS (para mostrar ícone correto)
const isIOSSafari = (): boolean => {
  return isIOS() && /Safari/.test(navigator.userAgent) && 
         !/CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent);
};

// Detectar macOS
const isMacOS = (): boolean => {
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
};

// Detectar Safari no macOS (não Chromium)
const isMacSafari = (): boolean => {
  return isMacOS() && 
         /Safari/.test(navigator.userAgent) && 
         !/Chrome|CriOS|Chromium|Edg/.test(navigator.userAgent);
};

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showMacSafariPrompt, setShowMacSafariPrompt] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Para iOS, mostrar instruções manuais
    if (isIOS()) {
      setIsSafari(isIOSSafari());
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed, 10) > 7 * 24 * 60 * 60 * 1000) {
        setShowIOSPrompt(true);
      }
      return;
    }

    // Para Safari no Mac, mostrar instruções manuais
    if (isMacSafari()) {
      const dismissed = localStorage.getItem('pwa-mac-safari-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed, 10) > 7 * 24 * 60 * 60 * 1000) {
        setShowMacSafariPrompt(true);
      }
      return;
    }

    // Verificar se já foi dismissado recentemente
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Mostrar novamente após 7 dias
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Salvar a URL atual como start_url do PWA
    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== '/') {
      localStorage.setItem('pwa-start-url', currentPath);
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-ios-dismissed', Date.now().toString());
  };

  const handleMacSafariDismiss = () => {
    setShowMacSafariPrompt(false);
    localStorage.setItem('pwa-mac-safari-dismissed', Date.now().toString());
  };

  // Prompt para Safari no Mac
  if (showMacSafariPrompt && !isInstalled) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border rounded-xl shadow-lg p-4 mx-auto max-w-md">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Instalar o App</h3>
              <p className="text-xs text-muted-foreground mt-1">
                No Safari, vá em <strong>Arquivo → Adicionar ao Dock</strong> ou clique no ícone <Share className="inline h-3.5 w-3.5 mx-0.5" /> na barra de endereço
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMacSafariDismiss}
                  className="flex-1"
                >
                  Entendi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMacSafariDismiss}
                >
                  Agora não
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleMacSafariDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prompt para iOS
  if (showIOSPrompt && !isInstalled) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border rounded-xl shadow-lg p-4 mx-auto max-w-md">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Instalar o App</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isSafari ? (
                  <>
                    Toque no ícone <Share className="inline h-3.5 w-3.5 mx-0.5" /> de compartilhar e depois em <strong>"Adicionar à Tela de Início"</strong>
                  </>
                ) : (
                  <>
                    Toque no menu <MoreVertical className="inline h-3.5 w-3.5 mx-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong>
                  </>
                )}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleIOSDismiss}
                  className="flex-1"
                >
                  Entendi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleIOSDismiss}
                >
                  Agora não
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleIOSDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border rounded-xl shadow-lg p-4 mx-auto max-w-md">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Instalar o PEDY</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione à tela inicial para acesso rápido e receber notificações
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="flex-1"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Instalar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
