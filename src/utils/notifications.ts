export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }
};

export const sendSystemNotification = (title: string, body?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        requireInteraction: false, // Don't require user interaction to dismiss, usually better for quick updates
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
};
