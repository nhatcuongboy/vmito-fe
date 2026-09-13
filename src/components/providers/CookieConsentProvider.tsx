'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type CookieConsentChoice,
  writeCookieConsent,
} from '@/lib/cookie-consent';

interface CookieConsentContextValue {
  choice: CookieConsentChoice | null;
  isOpen: boolean;
  isResolved: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

export function CookieConsentProvider({
  children,
  initialChoice,
}: {
  children: ReactNode;
  initialChoice: CookieConsentChoice | null;
}) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(
    initialChoice
  );
  const [isOpen, setIsOpen] = useState(initialChoice === null);

  const setConsent = useCallback((nextChoice: CookieConsentChoice) => {
    writeCookieConsent(nextChoice);
    setChoice(nextChoice);
    setIsOpen(false);
  }, []);

  const acceptAll = useCallback(() => setConsent('all'), [setConsent]);
  const acceptNecessary = useCallback(
    () => setConsent('necessary'),
    [setConsent]
  );
  const openSettings = useCallback(() => setIsOpen(true), []);
  const closeSettings = useCallback(() => {
    if (choice) setIsOpen(false);
  }, [choice]);

  const value = useMemo(
    () => ({
      choice,
      isOpen,
      isResolved: choice !== null,
      acceptAll,
      acceptNecessary,
      openSettings,
      closeSettings,
    }),
    [acceptAll, acceptNecessary, choice, closeSettings, isOpen, openSettings]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      'useCookieConsent must be used within CookieConsentProvider'
    );
  }
  return context;
}
