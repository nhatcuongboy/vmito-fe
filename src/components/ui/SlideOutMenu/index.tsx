'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/primitives/tooltip';
import { TournamentGuideButton } from '@/components/tournament/TournamentGuideButton';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import {
  ROUTES,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { Link, usePathname } from '@/i18n/config';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useFeatureFlagsStore,
  useFeatureFlag,
} from '@/stores/useFeatureFlagsStore';
import { useTournamentGuideVisibilityStore } from '@/stores/useTournamentGuideVisibilityStore';
import { LogIn, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  isNavLinkActive,
  NAV_SECTIONS,
  type NavContext,
  type NavTranslators,
} from './nav-config';
import { SidebarNavItem } from './SidebarNavItem';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerStyle = CSSProperties & Record<`--${string}`, string | number>;

const desktopMediaQuery = '(min-width: 48rem)';

function subscribeToDesktop(callback: () => void) {
  const media = window.matchMedia(desktopMediaQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopMediaQuery).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="navigation-section-heading">{children}</h2>;
}

function CollapsedTooltip({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: ReactElement;
}) {
  if (!enabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SwitcherSection({
  title,
  isCollapsed,
  children,
}: {
  title: string;
  isCollapsed: boolean;
  children: ReactElement;
}) {
  return (
    <section className="navigation-switcher-section">
      {!isCollapsed ? <SectionHeading>{title}</SectionHeading> : null}
      <Suspense fallback={<div className="navigation-loading-placeholder" />}>
        <CollapsedTooltip label={title} enabled={isCollapsed}>
          <div className="navigation-switcher-control">{children}</div>
        </CollapsedTooltip>
      </Suspense>
    </section>
  );
}

function AuthActions({
  isCollapsed,
  onClose,
}: {
  isCollapsed: boolean;
  onClose: () => void;
}) {
  const common = useTranslations('common');
  const actions = [
    {
      href: ROUTES.AUTH.SIGNIN,
      label: common('login'),
      icon: LogIn,
      variant: 'primary',
    },
    {
      href: ROUTES.AUTH.SIGNUP,
      label: common('register'),
      icon: UserPlus,
      variant: 'outline',
    },
  ] as const;

  return (
    <div className="navigation-auth-actions">
      {actions.map(({ href, label, icon: Icon, variant }) => {
        const link = (
          <Link
            key={href}
            href={href}
            className="navigation-auth-link"
            data-variant={variant}
            data-collapsed={isCollapsed ? 'true' : undefined}
            aria-label={label}
            onClick={onClose}
          >
            <Icon size={16} aria-hidden="true" />
            {!isCollapsed ? <span>{label}</span> : null}
          </Link>
        );

        return (
          <CollapsedTooltip key={href} label={label} enabled={isCollapsed}>
            {link}
          </CollapsedTooltip>
        );
      })}
    </div>
  );
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const home = useTranslations('pages.home');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
  const isCollapsed = isDesktop && isSidebarCollapsed;
  const pathname = usePathname();
  const [hasManagedVenues, setHasManagedVenues] = useState(false);
  const isGuideWidgetVisible = useTournamentGuideVisibilityStore(
    (state) => state.isVisible
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role === 'GUEST') {
      setHasManagedVenues(false);
      return;
    }
    VenueRentalService.getManagedVenues()
      .then((venues) => setHasManagedVenues(venues.length > 0))
      .catch(() => setHasManagedVenues(false));
  }, [isAuthenticated, user?.id, user?.role]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const classesFeatureEnabled = useFeatureFlag('CLASSES_FEATURE_ENABLED');

  const context: NavContext = {
    user,
    isAuthenticated,
    canAccessHostFeatures,
    hasManagedVenues,
    classesFeatureEnabled,
  };
  const translators: NavTranslators = { nav, common };
  const showAuthActions =
    isHydrated &&
    !isLoading &&
    !isAuthenticated &&
    !pathname.includes('/auth/signin') &&
    !pathname.includes('/auth/signup');
  const drawerStyle: DrawerStyle = {
    '--navigation-top-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
    '--navigation-top-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
    '--navigation-width-expanded': `${SIDEBAR_WIDTH_EXPANDED}px`,
    '--navigation-width-collapsed': `${SIDEBAR_WIDTH_COLLAPSED}px`,
  };

  return (
    <TooltipProvider delayDuration={200}>
      {isOpen ? (
        <button
          type="button"
          data-slot="navigation-overlay"
          className="navigation-overlay"
          aria-label={common('closeMenu')}
          onClick={onClose}
        />
      ) : null}

      <aside
        id="global-navigation-drawer"
        data-slot="navigation-drawer"
        data-state={isOpen ? 'open' : 'closed'}
        data-collapsed={isCollapsed ? 'true' : undefined}
        className="navigation-drawer"
        style={drawerStyle}
        aria-label={common('navigation')}
      >
        <div className="navigation-drawer-body">
          <nav
            className="navigation-sections"
            aria-label={common('navigation')}
          >
            {NAV_SECTIONS.map((section) => {
              if (section.isVisible && !section.isVisible(context)) return null;

              return (
                <Fragment key={section.key}>
                  <section className="navigation-section">
                    {!isCollapsed ? (
                      <SectionHeading>
                        {section.title(translators)}
                      </SectionHeading>
                    ) : null}
                    <div className="navigation-section-items">
                      {section.items.map((item) => {
                        if (item.isVisible && !item.isVisible(context)) {
                          return null;
                        }
                        if ('component' in item) {
                          const ItemComponent = item.component;
                          return (
                            <ItemComponent
                              key={item.key}
                              isCollapsed={isCollapsed}
                              onClose={onClose}
                            />
                          );
                        }
                        return (
                          <SidebarNavItem
                            key={item.key}
                            href={item.getHref(context)}
                            label={item.label(translators)}
                            icon={item.icon}
                            isActive={isNavLinkActive(item, pathname, context)}
                            isCollapsed={isCollapsed}
                            showFlame={item.showFlame}
                            onClose={onClose}
                          />
                        );
                      })}
                    </div>
                  </section>
                  <hr className="navigation-separator" />
                </Fragment>
              );
            })}
          </nav>

          <div className="navigation-utilities">
            <SwitcherSection
              title={common('language')}
              isCollapsed={isCollapsed}
            >
              <LanguageSwitcher isCollapsed={isCollapsed} />
            </SwitcherSection>

            <SwitcherSection title={common('theme')} isCollapsed={isCollapsed}>
              <ThemeSwitcher isCollapsed={isCollapsed} />
            </SwitcherSection>
          </div>

          <footer className="navigation-footer">
            {/\/tournament\/[^/]+/.test(pathname) && !isGuideWidgetVisible ? (
              <div className="navigation-tournament-guide">
                <TournamentGuideButton isCollapsed={isCollapsed} />
              </div>
            ) : null}

            {showAuthActions ? (
              <AuthActions isCollapsed={isCollapsed} onClose={onClose} />
            ) : null}

            {!isCollapsed ? (
              <div className="navigation-copyright">
                <p>
                  © {new Date().getFullYear()} {common('appName')}.{' '}
                  {home('copyright')}
                </p>
                <p>{common('developedBy')}</p>
              </div>
            ) : null}
          </footer>
        </div>
      </aside>
    </TooltipProvider>
  );
}
