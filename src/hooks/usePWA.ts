'use client';

import { useEffect, useState } from 'react';
import {
  detectPWAPlatform,
  isPWAStandalone,
  PWAPlatform,
} from '@/lib/pwa/install';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [platform, setPlatform] = useState<PWAPlatform>('other');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkInstallStatus = () => {
      setIsInstalled(
        isPWAStandalone(
          window.matchMedia('(display-mode: standalone)').matches,
          window.navigator as { standalone?: boolean }
        )
      );
    };

    // Check online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    // Initialize
    checkInstallStatus();
    updateOnlineStatus();
    setPlatform(
      detectPWAPlatform(navigator.userAgent, navigator.maxTouchPoints)
    );

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Service Worker registration and update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Listen for controller change (new SW took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update();
        });
      });
      window.location.reload();
    }
  };

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
    return outcome;
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  };

  return {
    isOnline,
    isInstalled,
    isInstallable,
    platform,
    promptInstall,
    updateAvailable,
    updateServiceWorker,
    requestNotificationPermission,
    sendNotification,
  };
}
