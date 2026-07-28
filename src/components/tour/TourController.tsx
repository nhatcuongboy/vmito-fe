'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';

import { usePathname, useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { UserRole } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useTourStore } from '@/stores/useTourStore';
import {
  SESSION_DETAIL_RE,
  TOURS,
  TOUR_IDS,
  TourDefinition,
  TourStepDef,
} from './tourSteps';
import TourResumeChip from './TourResumeChip';

type DriverInstance = ReturnType<typeof driver>;

const POLL_INTERVAL_MS = 300;
const POLL_MAX_MISSES = 27; // ~8s without the element -> give up, show chip

const FIRST_TOUR = TOUR_IDS[0];

/** First *visible* element matching any of the selectors */
const findVisibleElement = (selectors: string[]): HTMLElement | null => {
  for (const selector of selectors) {
    const candidates = document.querySelectorAll<HTMLElement>(selector);
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el;
    }
  }
  return null;
};

/** True while any Chakra dialog/drawer is open — the tour hides under modals */
const isModalOpen = (): boolean => {
  const dialogs = document.querySelectorAll<HTMLElement>(
    '[role="dialog"], [role="alertdialog"]'
  );
  for (const el of dialogs) {
    // driver.js marks its own popover role="dialog" — that's us, not a modal
    if (el.closest('.driver-popover')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return true;
  }
  return false;
};

/** Declarative auto-advance: URL (and optional tab) matches the step's rule */
const shouldAutoAdvance = (
  step: TourStepDef,
  pathname: string,
  tab: number
): boolean => {
  if (!step.advanceWhen) return false;
  const { pathname: re, tab: reqTab } = step.advanceWhen;
  if (!re.test(pathname)) return false;
  if (reqTab !== undefined && tab !== reqTab) return false;
  return true;
};

const TourControllerInner = () => {
  const t = useTranslations('productTour');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHydrated = useAuthStore((s) => s.isHydrated);

  const prefHydrated = usePreferenceStore((s) => s._hasHydrated);
  const onboardingCompleted = usePreferenceStore((s) => s.onboardingCompleted);

  const tours = useTourStore((s) => s.tours);
  const tourSessionId = useTourStore((s) => s.tourSessionId);
  const tourHydrated = useTourStore((s) => s._hasHydrated);

  // Only one tour may be active at a time
  const activeTourId =
    TOUR_IDS.find((id) => tours[id].status === 'active') ?? null;
  const activeTour: TourDefinition | null = activeTourId
    ? TOURS[activeTourId]
    : null;
  const currentStep = activeTourId ? tours[activeTourId].currentStep : 0;

  const driverRef = useRef<DriverInstance | null>(null);
  const programmaticDestroyRef = useRef(false);
  const highlightedElRef = useRef<HTMLElement | null>(null);
  const highlightedDisabledRef = useRef(false);
  const clickCleanupRef = useRef<(() => void) | null>(null);
  const autoStartCheckedRef = useRef(false);

  // Paused position keyed by "<tourId>:<step>" so it survives tour switches
  const [pausedKey, setPausedKey] = useState<string | null>(null);
  const [chipVisible, setChipVisible] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const tabParam = searchParams.get('tab');
  const tab = tabParam ? Number.parseInt(tabParam, 10) || 0 : 0;

  const currentKey = activeTourId ? `${activeTourId}:${currentStep}` : null;

  const getDriver = useCallback((): DriverInstance => {
    if (!driverRef.current) {
      driverRef.current = driver({
        showButtons: ['close'],
        overlayOpacity: 0.6,
        stagePadding: 6,
        popoverClass: 'vmito-tour',
        allowKeyboardControl: false,
        onDestroyStarted: () => {
          const d = driverRef.current;
          if (!programmaticDestroyRef.current) {
            // User closed (X / overlay / Esc): pause, don't skip forever
            const state = useTourStore.getState();
            const activeId = TOUR_IDS.find(
              (id) => state.tours[id].status === 'active'
            );
            if (activeId) {
              setPausedKey(`${activeId}:${state.tours[activeId].currentStep}`);
            }
          }
          d?.destroy();
        },
      });
    }
    return driverRef.current;
  }, []);

  const destroyOverlay = useCallback(() => {
    clickCleanupRef.current?.();
    clickCleanupRef.current = null;
    highlightedElRef.current = null;
    highlightedDisabledRef.current = false;
    if (driverRef.current?.isActive()) {
      programmaticDestroyRef.current = true;
      driverRef.current.destroy();
      programmaticDestroyRef.current = false;
    }
  }, []);

  // --- Auto-start the first tour: authenticated user with zero hosted sessions ---
  useEffect(() => {
    if (autoStartCheckedRef.current) return;
    if (!authHydrated || !tourHydrated || !prefHydrated) return;
    if (!isAuthenticated || !user?.id) return;
    if (tours[FIRST_TOUR].status !== 'idle') return;
    // Don't interrupt another running tour
    if (TOUR_IDS.some((id) => tours[id].status === 'active')) return;
    // Let the city onboarding modal resolve first. A user who picked "All"
    // has preferredCity === null but onboardingCompleted === true, so gate on
    // the onboarding flag rather than the city value.
    if (!onboardingCompleted) return;

    autoStartCheckedRef.current = true;
    SessionService.getAllSessions({
      hostId: user.id,
      limit: 1,
      sessionType: 'regular',
    })
      .then((res) => {
        if (res.total === 0) {
          useTourStore.getState().startTour(FIRST_TOUR);
        }
      })
      .catch(() => {
        // Never block the app because of the tour
      });
  }, [
    authHydrated,
    tourHydrated,
    prefHydrated,
    isAuthenticated,
    user?.id,
    tours,
    onboardingCompleted,
  ]);

  // --- Capture the session slug/id whenever we're on its management page ---
  useEffect(() => {
    if (!activeTourId) return;
    const match = pathname.match(/^\/(?:host|player)\/sessions\/([^/]+)$/);
    if (match && !['joined', 'ended', 'pending', 'join'].includes(match[1])) {
      if (tourSessionId !== match[1]) {
        useTourStore.getState().setTourSessionId(match[1]);
      }
    }
  }, [activeTourId, pathname, tourSessionId]);

  // --- Resolve & highlight the current step ---
  useEffect(() => {
    if (!tourHydrated) return;
    if (!activeTour || !activeTourId || !isAuthenticated) {
      destroyOverlay();
      setChipVisible(false);
      return;
    }

    const step: TourStepDef | undefined = activeTour.steps[currentStep];
    if (!step) return;

    if (shouldAutoAdvance(step, pathname, tab)) {
      useTourStore.getState().completeStep(activeTourId, step.id);
      return;
    }

    if (pausedKey === currentKey) {
      destroyOverlay();
      setChipVisible(true);
      return;
    }

    const routeOk = !step.route || step.route.test(pathname);
    const tabOk = step.tab === undefined || tab === step.tab;
    if (!routeOk || !tabOk) {
      destroyOverlay();
      setChipVisible(true);
      return;
    }

    setChipVisible(false);

    const keyBase = `tours.${activeTour.i18nNamespace}.steps.${step.i18nKey}`;
    const progressLine = `<div class="vmito-tour-progress-line">${t(
      'progress',
      { current: currentStep + 1, total: activeTour.steps.length }
    )}</div>`;
    const title = t(`${keyBase}.title`);
    const description = `${t(`${keyBase}.description`)}${progressLine}`;
    // Alternate copy shown while the anchor button is disabled
    const disabledTitle = step.disabledHint
      ? t(`${keyBase}.disabledTitle`)
      : title;
    const disabledDescription = step.disabledHint
      ? `${t(`${keyBase}.disabledDescription`)}${progressLine}`
      : description;

    // Element-less final step: centered popover with a finish button
    if (step.selectors.length === 0) {
      const d = getDriver();
      d.highlight({
        popover: {
          title,
          description,
          showButtons: ['next', 'close'],
          nextBtnText: t('finish'),
          onNextClick: () => {
            useTourStore.getState().completeTour(activeTourId);
            programmaticDestroyRef.current = true;
            d.destroy();
            programmaticDestroyRef.current = false;
          },
        },
      });
      return () => destroyOverlay();
    }

    let misses = 0;
    const tick = () => {
      // Hide while a modal/drawer is open; resume when it closes
      if (isModalOpen()) {
        if (highlightedElRef.current) destroyOverlay();
        misses = 0;
        return;
      }

      const el = findVisibleElement(step.selectors);
      if (!el) {
        misses += 1;
        if (highlightedElRef.current) destroyOverlay();
        if (misses > POLL_MAX_MISSES) {
          window.clearInterval(intervalId);
          setChipVisible(true);
        }
        return;
      }

      misses = 0;
      const isDisabled =
        step.disabledHint === true &&
        (el.matches(':disabled') ||
          el.getAttribute('aria-disabled') === 'true' ||
          el.hasAttribute('data-disabled'));

      const d = getDriver();
      // Re-highlight when the anchor or its disabled state changes so the
      // popover copy can switch between the instruction and the hint.
      if (
        highlightedElRef.current === el &&
        highlightedDisabledRef.current === isDisabled &&
        d.isActive()
      ) {
        return;
      }

      clickCleanupRef.current?.();
      clickCleanupRef.current = null;

      d.highlight({
        element: el,
        popover: {
          title: isDisabled ? disabledTitle : title,
          description: isDisabled ? disabledDescription : description,
          side: step.side,
          showButtons: ['close'],
        },
      });
      highlightedElRef.current = el;
      highlightedDisabledRef.current = isDisabled;

      // A disabled button never fires click, so only wire the modal-open
      // handler when the button is actionable.
      if (step.hidesOnClick && !isDisabled) {
        const onClick = () => destroyOverlay();
        el.addEventListener('click', onClick, { capture: true, once: true });
        clickCleanupRef.current = () =>
          el.removeEventListener('click', onClick, { capture: true });
      }
    };

    tick();
    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      destroyOverlay();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tourHydrated,
    activeTourId,
    isAuthenticated,
    currentStep,
    pathname,
    tab,
    pausedKey,
    retryNonce,
  ]);

  // --- Resume chip actions ---
  const handleResume = useCallback(() => {
    const state = useTourStore.getState();
    const activeId = TOUR_IDS.find((id) => state.tours[id].status === 'active');
    if (!activeId) return;
    const step = TOURS[activeId].steps[state.tours[activeId].currentStep];
    if (!step) return;

    setPausedKey(null);
    setChipVisible(false);
    setRetryNonce((n) => n + 1);

    const routeOk = !step.route || step.route.test(pathname);
    const tabOk = step.tab === undefined || tab === step.tab;
    if (routeOk && tabOk) return;

    // Navigate back to where the current step lives
    const sessionId = state.tourSessionId;
    const detailBase =
      user?.role === UserRole.PLAYER || user?.role === UserRole.REFEREE
        ? '/player/sessions'
        : '/host/sessions';

    let target: string = ROUTES.HOST.SESSIONS.LIST;
    if (step.id === 'submit-session') {
      target = ROUTES.SESSIONS.NEW;
    } else if (step.id === 'manage-session' && sessionId) {
      target = `/sessions/${sessionId}`;
    } else if (step.route === SESSION_DETAIL_RE && sessionId) {
      target = `${detailBase}/${sessionId}${
        step.tab !== undefined ? `?tab=${step.tab}` : ''
      }`;
    }
    router.push(target);
  }, [pathname, tab, user?.role, router]);

  const handleDismiss = useCallback(() => {
    const activeId = TOUR_IDS.find(
      (id) => useTourStore.getState().tours[id].status === 'active'
    );
    if (activeId) useTourStore.getState().skipTour(activeId);
    setChipVisible(false);
  }, []);

  if (!activeTourId || !chipVisible) return null;
  return <TourResumeChip onResume={handleResume} onDismiss={handleDismiss} />;
};

/** Global product-tour singleton; mounted once in app providers */
const TourController = () => (
  <Suspense fallback={null}>
    <TourControllerInner />
  </Suspense>
);

export default TourController;
