import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Convert base64 string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

interface UseStorePushNotificationsResult {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: (establishmentId: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function useStorePushNotifications(): UseStorePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check browser support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('store_push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async (establishmentId: string): Promise<boolean> => {
    if (!isSupported) {
      console.error('Push notifications not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BLBz5HXVl_UQKVFwE1lON3lXQJEblGvxZNH8K_pF8R9HVZsRxvJQRNHRfnG8G0xQWvVf9P5p7GyMnXvWnKpqvZk';

      // Subscribe to push notifications - convert Uint8Array to ArrayBuffer
      const applicationServerKeyArray = urlBase64ToUint8Array(vapidPublicKey);
      const applicationServerKey = applicationServerKeyArray.buffer.slice(
        applicationServerKeyArray.byteOffset,
        applicationServerKeyArray.byteOffset + applicationServerKeyArray.byteLength
      ) as ArrayBuffer;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Extract subscription details
      const subscriptionJSON = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJSON.keys?.p256dh || '';
      const auth = subscriptionJSON.keys?.auth || '';

      // Save to database
      const { error } = await supabase
        .from('store_push_subscriptions')
        .upsert({
          user_id: user.id,
          establishment_id: establishmentId,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Remove from database
      const { error } = await supabase
        .from('store_push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing subscription:', error);
        throw error;
      }

      // Unsubscribe from browser push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
