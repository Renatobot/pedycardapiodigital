import { useEffect } from 'react';

interface ManifestOptions {
  name: string;
  shortName: string;
  description?: string;
  startUrl: string;
  iconUrl?: string;
  themeColor?: string;
  backgroundColor?: string;
}

export function useDynamicManifest(options: ManifestOptions | null) {
  useEffect(() => {
    if (!options) return;

    const manifest = {
      name: options.name,
      short_name: options.shortName,
      description: options.description || `Cardápio de ${options.name}`,
      start_url: options.startUrl,
      display: "standalone",
      orientation: "portrait",
      background_color: options.backgroundColor || "#ffffff",
      theme_color: options.themeColor || "#4A9BD9",
      icons: [
        {
          src: options.iconUrl || "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: options.iconUrl || "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ]
    };

    // Criar blob do manifest e injetar no <head>
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    // Salvar referência ao link original
    const existingManifestLink = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = existingManifestLink?.getAttribute('href') || '/manifest.json';

    // Atualizar ou criar link do manifest
    let manifestLink = existingManifestLink;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestUrl);

    // Atualizar meta tags para iOS
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleTitle?.getAttribute('content') || 'PEDY';
    if (appleTitle) appleTitle.setAttribute('content', options.shortName);

    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    const originalAppleTouchIcon = appleTouchIcon?.getAttribute('href') || '/pwa-192x192.png';
    if (appleTouchIcon && options.iconUrl) {
      appleTouchIcon.setAttribute('href', options.iconUrl);
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = themeColorMeta?.getAttribute('content') || '#4A9BD9';
    if (themeColorMeta && options.themeColor) {
      themeColorMeta.setAttribute('content', options.themeColor);
    }

    // Cleanup: restaurar manifest original ao sair da página
    return () => {
      if (manifestLink) {
        manifestLink.setAttribute('href', originalManifestHref);
      }
      if (appleTitle) {
        appleTitle.setAttribute('content', originalAppleTitle);
      }
      if (appleTouchIcon) {
        appleTouchIcon.setAttribute('href', originalAppleTouchIcon);
      }
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', originalThemeColor);
      }
      URL.revokeObjectURL(manifestUrl);
    };
  }, [options?.name, options?.shortName, options?.startUrl, options?.iconUrl, options?.themeColor, options?.backgroundColor]);
}
