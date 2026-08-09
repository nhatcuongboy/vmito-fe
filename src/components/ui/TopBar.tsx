'use client';

import { DebouncedAppSearchBar } from '@/components/common/DebouncedAppSearchBar';
import {
  ROUTES,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTopBarSearch } from '@/contexts/TopBarSearchContext';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';
import { Link, usePathname, useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { ChevronLeft, LogIn, Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, type CSSProperties, type ReactNode } from 'react';
import AiAssistantTopBarButton from './AiAssistantTopBarButton';
import CitySelector from './CitySelector';
import SlideOutMenu from './SlideOutMenu';
import SubNavigation, { type NavItem } from './SubNavigation';

const ActionPlaceholder = () => (
  <div aria-hidden="true" style={{ width: 40, height: 40 }} />
);

const NotificationBell = dynamic(() => import('./NotificationBell'), {
  ssr: false,
  loading: ActionPlaceholder,
});
const UserMenu = dynamic(() => import('./UserMenu'), {
  ssr: false,
  loading: ActionPlaceholder,
});

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  mobileIcon?: ReactNode;
  rightContent?: ReactNode;
  navItems?: NavItem[];
  variant?: 'main' | 'secondary';
  hideBottomBorder?: boolean;
  centerTitle?: boolean;
  showMenuButton?: boolean;
  showLogo?: boolean;
  logoHref?: string;
  showLogoDesktopOnly?: boolean;
  showAuthActions?: boolean;
  showAiAssistantButton?: boolean;
  showCitySelector?: boolean;
  className?: string;
  desktopSearchContent?: ReactNode;
}

type TopBarStyle = CSSProperties & Record<`--${string}`, string | number>;

export default function TopBar({
  title,
  icon,
  mobileIcon,
  rightContent,
  showBackButton = false,
  backHref = '/',
  onBack,
  navItems,
  variant = 'main',
  hideBottomBorder = false,
  centerTitle = false,
  showMenuButton = true,
  showLogo = true,
  logoHref = '/',
  showLogoDesktopOnly = false,
  showAuthActions = true,
  showAiAssistantButton = true,
  showCitySelector = false,
  className,
  desktopSearchContent,
}: TopBarProps) {
  const common = useTranslations('common');
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleCollapse } = useSidebar();
  const showAiAssistant = useAiAssistantVisibility();
  const { searchConfig, callbacksRef } = useTopBarSearch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const resolvedDesktopSearch = searchConfig ? (
    <DebouncedAppSearchBar
      value={searchConfig.value}
      onChange={(value) => callbacksRef.current?.onChange(value)}
      placeholder={searchConfig.placeholder}
      onFilterClick={
        searchConfig.hasFilterClick
          ? () => callbacksRef.current?.onFilterClick?.()
          : undefined
      }
      activeFilterCount={searchConfig.activeFilterCount}
      showFilter={searchConfig.showFilter}
    />
  ) : (
    desktopSearchContent
  );

  const normalizedPath =
    pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
  const isLeftAlignedTitle =
    !centerTitle &&
    /^\/(player\/|host\/)?(sessions|venues|clubs|tournaments?)\/(?!(new|create|joined|pending|edit)$)[^/]+$/.test(
      normalizedPath
    );
  const isCenteredTitle = !isLeftAlignedTitle;
  const hasNavItems = Boolean(navItems?.length);
  const showLogin =
    showAuthActions &&
    isHydrated &&
    !isLoading &&
    !isAuthenticated &&
    !pathname.includes('/auth/signin') &&
    !pathname.includes('/auth/signup');
  const topBarStyle: TopBarStyle = {
    '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
    '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
    '--top-bar-subnav': hasNavItems ? '40px' : '0px',
  };

  const handleMenu = () => {
    if (window.innerWidth < 768) {
      setIsMenuOpen((open) => !open);
      return;
    }
    toggleCollapse();
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsMenuOpen(false);
    router.push(ROUTES.AUTH.SIGNIN);
  };

  const defaultLogo = (
    <Image
      src="/icons/app-logo-96.png"
      width={32}
      height={32}
      alt={common('appName')}
      priority
    />
  );

  return (
    <>
      <header
        data-slot="top-bar"
        data-variant={variant}
        data-has-subnav={hasNavItems ? 'true' : undefined}
        data-hide-mobile-border={hideBottomBorder ? 'true' : undefined}
        className={cn('top-bar-shell', className)}
        style={topBarStyle}
      >
        <div className="top-bar-row">
          <div
            className="top-bar-left"
            data-left-title={isLeftAlignedTitle ? 'true' : undefined}
          >
            {showMenuButton ? (
              <button
                type="button"
                className="top-bar-icon-button top-bar-menu-button"
                aria-label={
                  isMenuOpen ? common('closeMenu') : common('openMenu')
                }
                aria-controls="global-navigation-drawer"
                aria-expanded={isMenuOpen}
                onClick={handleMenu}
              >
                <Menu size={20} aria-hidden="true" />
              </button>
            ) : null}

            {showLogo ? (
              <div
                className="top-bar-logo"
                data-desktop-only={
                  variant === 'secondary' || showLogoDesktopOnly
                    ? 'true'
                    : undefined
                }
              >
                <Link href={logoHref} className="top-bar-logo-link">
                  <span className="top-bar-logo-mark">
                    <span className="top-bar-logo-mobile">
                      {mobileIcon || icon || defaultLogo}
                    </span>
                    <span className="top-bar-logo-desktop">
                      {icon || defaultLogo}
                    </span>
                  </span>
                  <span className="top-bar-brand" translate="no">
                    Vmito
                  </span>
                </Link>
              </div>
            ) : null}

            {showCitySelector && variant !== 'secondary' ? (
              <div className="top-bar-city-selector">
                <CitySelector />
              </div>
            ) : null}

            {showBackButton || variant === 'secondary' ? (
              <div className="top-bar-back">
                {onBack ? (
                  <button
                    type="button"
                    className="top-bar-icon-button top-bar-back-button"
                    aria-label={common('back')}
                    onClick={onBack}
                  >
                    <ChevronLeft
                      size={28}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <Link
                    href={backHref}
                    className="top-bar-icon-button top-bar-back-button"
                    aria-label={common('back')}
                  >
                    <ChevronLeft
                      size={28}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </div>
            ) : null}

            {title && isLeftAlignedTitle ? (
              <h2 className="top-bar-title top-bar-title-left">{title}</h2>
            ) : null}
          </div>

          {resolvedDesktopSearch ? (
            <div className="top-bar-search">
              <div className="top-bar-search-inner">
                {resolvedDesktopSearch}
              </div>
            </div>
          ) : null}

          {title && isCenteredTitle ? (
            <div
              className="top-bar-title-center-wrap"
              data-mobile-only={resolvedDesktopSearch ? 'true' : undefined}
            >
              <h2 className="top-bar-title top-bar-title-center">{title}</h2>
            </div>
          ) : null}

          <div className="top-bar-actions">
            {rightContent}

            {showAuthActions && isHydrated && !isLoading && isAuthenticated ? (
              <div className="top-bar-authenticated-actions">
                {showAiAssistant && showAiAssistantButton ? (
                  <AiAssistantTopBarButton />
                ) : null}
                <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
                <UserMenu onLogout={handleLogout} />
              </div>
            ) : showLogin ? (
              <Link
                href="/auth/signin"
                className="top-bar-login"
                aria-label={common('login')}
              >
                <LogIn size={17} aria-hidden="true" />
                <span>{common('login')}</span>
              </Link>
            ) : null}
          </div>
        </div>

        {navItems?.length ? <SubNavigation items={navItems} /> : null}
      </header>

      {showMenuButton ? (
        <SlideOutMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      ) : null}
    </>
  );
}
