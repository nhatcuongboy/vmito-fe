'use client';

import { useEffect, useState } from 'react';
import AppSplashScreen from './AppSplashScreen';

const SPLASH_DURATION_MS = 1200;
const SPLASH_EXIT_MS = 260;

function isMobileStandalonePWA() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  const isMobileLike =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 767px)').matches;

  return isStandalone && isMobileLike;
}

export default function AppStartupSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isMobileStandalonePWA()) return;

    setIsVisible(true);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, SPLASH_DURATION_MS);
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, SPLASH_DURATION_MS + SPLASH_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <AppSplashScreen
      className={`app-splash--startup ${isExiting ? 'app-splash--exit' : ''}`}
    />
  );
}
