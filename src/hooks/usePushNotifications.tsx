import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Chave pública VAPID (deve ser a mesma configurada no servidor)
const VAPID_PUBLIC_KEY = 'BDhm-wj0pokxbykYW8NVsOkVy1buXoNUxqKCPFYmJRIrngLYUxk4vizUvmj1HhXeB2nP4jnUe9Y8rw4M9vgRXiU';

// Converter base64 para Uint8Array (necessário para applicationServerKey)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UsePushNotificationsResult {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: (establishmentId: string, customerPhone: string, customerId?: string) => Promise<boolean>;
  unsubscribe: (establishmentId: string, customerPhone: string) => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar suporte
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async (establishmentId: string, customerPhone: string, customerId?: string): Promise<boolean> => {
    if (!isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Solicitar permissão
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Aguardar service worker estar pronto
      const registration = await navigator.serviceWorker.ready;

      // Verificar se já existe subscription
      let subscription = await registration.pushManager.getSubscription();

      // Se não existe, criar nova
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      // Extrair dados da subscription
      const subscriptionData = subscription.toJSON();
      const endpoint = subscriptionData.endpoint!;
      const p256dh = subscriptionData.keys?.p256dh || '';
      const auth = subscriptionData.keys?.auth || '';

      // Salvar no Supabase (incluindo customer_id se disponível)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            establishment_id: establishmentId,
            customer_phone: customerPhone,
            customer_id: customerId || null,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent,
          },
          {
            onConflict: 'establishment_id,customer_phone',
          }
        );

      if (error) {
        console.error('Error saving subscription:', error);
        setIsLoading(false);
        return false;
      }

      console.log('Push subscription saved successfully');
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (establishmentId: string, customerPhone: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Remover do Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('establishment_id', establishmentId)
        .eq('customer_phone', customerPhone);

      if (error) {
        console.error('Error removing subscription:', error);
        setIsLoading(false);
        return false;
      }

      // Cancelar subscription no navegador
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
