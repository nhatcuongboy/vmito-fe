# Progressive Web App (PWA) Setup

This document outlines the PWA implementation for the Vmito app.

## Overview

The app has been configured as a Progressive Web App with the following features:

### ✅ Core PWA Features

- **App Manifest**: Complete web app manifest with icons and metadata
- **Service Worker**: Custom service worker for caching and offline functionality
- **Installable**: Users can install the app on their devices
- **Offline Support**: Basic offline functionality with caching
- **Push Notifications**: Framework for push notifications (requires backend setup)
- **Background Sync**: Support for background data synchronization

### 📱 Installation

Users can install the app by:

1. Visiting the website on a PWA-compatible browser
2. Looking for the "Install App" prompt or browser install button
3. Following the installation prompts

### 🔧 Technical Implementation

#### Files Created/Modified:

1. **`next.config.ts`** - PWA configuration with next-pwa
2. **`public/manifest.json`** - Web app manifest
3. **`public/sw.js`** - Custom service worker
4. **`public/icons/`** - App icons (placeholder SVGs, replace with PNG)
5. **`src/app/layout.tsx`** - PWA metadata and viewport settings
6. **`src/components/PWAComponents.tsx`** - Install prompt and status components
7. **`src/hooks/usePWA.ts`** - PWA functionality hook
8. **`src/app/api/pwa/`** - PWA-related API endpoints

#### Service Worker Features:

- **Caching Strategy**: NetworkFirst for all requests
- **Background Sync**: Support for offline data synchronization
- **Push Notifications**: Framework for notifications
- **Update Detection**: Automatic detection of app updates

#### Components:

- **PWAInstallPrompt**: Shows install prompt to users
- **PWAStatus**: Shows offline/online status and update notifications
- **usePWA Hook**: Provides PWA functionality to components

### 🚀 Setup Instructions

1. **Icons**: Replace placeholder icon files in `public/icons/` with proper PNG icons:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

2. **Manifest Customization**: Update `public/manifest.json` with:
   - Correct app name and description
   - Proper theme colors
   - App categories and language settings

3. **Service Worker**: Customize `public/sw.js` for specific caching needs:
   - Add important routes to cache
   - Configure background sync logic
   - Set up push notification handling

4. **Push Notifications** (Optional):
   - Set up a push notification service (Firebase, etc.)
   - Configure VAPID keys
   - Implement notification sending in backend
   - Update API endpoints in `src/app/api/pwa/`

### 📊 PWA Features Status

| Feature            | Status         | Notes                            |
| ------------------ | -------------- | -------------------------------- |
| Manifest           | ✅ Complete    | Ready for production             |
| Service Worker     | ✅ Complete    | Basic caching implemented        |
| Installability     | ✅ Complete    | Install prompt included          |
| Offline Support    | ✅ Basic       | Caches requests, can be enhanced |
| Push Notifications | 🔄 Framework   | Requires backend setup           |
| Background Sync    | 🔄 Framework   | API endpoints ready              |
| App Icons          | ⚠️ Placeholder | Replace with proper icons        |

### 🧪 Testing

To test PWA functionality:

1. **Development**: PWA is disabled in development mode
2. **Production**:
   ```bash
   pnpm build
   pnpm start
   ```
3. **Lighthouse**: Run Lighthouse audit for PWA score
4. **Browser DevTools**: Check Application tab for:
   - Manifest
   - Service Worker status
   - Cache storage
   - Push messaging

### 🔧 Customization

#### Adding Custom Caching:

```javascript
// In public/sw.js
const urlsToCache = ['/', '/your-important-route', '/static/css/main.css'];
```

#### Using PWA Hook:

```tsx
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { isOnline, isInstalled, sendNotification } = usePWA();

  // Use PWA features
}
```

#### Sending Notifications:

```tsx
const { sendNotification } = usePWA();

sendNotification('New Session Started', {
  body: 'A new badminton session is ready to join!',
  tag: 'session-notification',
});
```

### 📝 Next Steps

1. **Replace Icons**: Create proper app icons in PNG format
2. **Test Installation**: Test on various devices and browsers
3. **Configure Push**: Set up push notification service if needed
4. **Optimize Caching**: Fine-tune caching strategy for your app
5. **Monitor Performance**: Use analytics to track PWA usage

### 🐛 Troubleshooting

- **Install prompt not showing**: Check manifest validation and HTTPS
- **Service worker not registering**: Check console for errors
- **Icons not loading**: Ensure proper file formats and sizes
- **Offline not working**: Verify service worker caching strategy

### 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Next.js PWA Guide](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
