/// <reference lib="webworker" />

// Service Worker para Push Notifications do PEDY

const CACHE_NAME = 'pedy-v1';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(clients.claim());
});

// Receber push notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body || 'Você tem uma atualização!',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      tag: data.tag || 'pedy-notification',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Ver pedido',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PEDY', options)
    );
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir ou focar a janela do app
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen && urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }

      // Abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Push subscription change (renovação)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed:', event);
  // Aqui poderia renovar a subscription, mas é complexo sem contexto do usuário
});
