import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions & { roomCode?: string; url?: string }) => {
    if (!isSupported || permission !== 'granted') return;

    // Check if app is in foreground
    if (document.visibilityState === 'visible') return;

    if (swRegistration) {
      swRegistration.showNotification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: options?.roomCode || 'realchat',
        ...options,
        data: {
          url: options?.url || '/',
          roomCode: options?.roomCode
        }
      });
    } else if ('Notification' in window) {
      new Notification(title, {
        icon: '/favicon.png',
        ...options
      });
    }
  }, [isSupported, permission, swRegistration]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification
  };
}
