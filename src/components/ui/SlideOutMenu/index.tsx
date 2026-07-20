'use client';

import {
  Box,
  Flex,
  Separator,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { LogIn, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, Suspense, useEffect, useState, type ReactNode } from 'react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { VTooltip } from '@/components/ui/VTooltip';
import {
  ROUTES,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { usePathname } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  isNavLinkActive,
  NAV_SECTIONS,
  type NavContext,
  type NavTranslators,
} from './nav-config';
import { SidebarNavItem } from './SidebarNavItem';
import { TOOLTIP_OPEN_DELAY, TOOLTIP_POSITIONING } from './nav-styles';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const PANEL_TOP = {
  base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
  md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
};

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={3}>
      {children}
    </Text>
  );
}

/** Shared layout for the language/theme switcher blocks. */
function SwitcherSection({
  title,
  isCollapsed,
  children,
}: {
  title: string;
  isCollapsed: boolean;
  children: (isCollapsed: boolean) => ReactNode;
}) {
  return (
    <Box>
      {!isCollapsed && <SectionHeading>{title}</SectionHeading>}
      <Suspense fallback={<Text fontSize="sm">Loading...</Text>}>
        {isCollapsed ? (
          <VTooltip
            content={title}
            positioning={TOOLTIP_POSITIONING}
            showArrow
            openDelay={TOOLTIP_OPEN_DELAY}
          >
            <Box w="full" px={1}>
              {children(true)}
            </Box>
          </VTooltip>
        ) : (
          <Box w="180px">{children(false)}</Box>
        )}
      </Suspense>
    </Box>
  );
}

/** Login/register buttons shown to unauthenticated visitors. */
function AuthActions({
  isCollapsed,
  onClose,
}: {
  isCollapsed: boolean;
  onClose: () => void;
}) {
  const common = useTranslations('common');

  return (
    <Stack gap={2} mb={4}>
      <VTooltip
        content={common('login')}
        positioning={TOOLTIP_POSITIONING}
        disabled={!isCollapsed}
        showArrow
        openDelay={TOOLTIP_OPEN_DELAY}
      >
        <NextLinkButton
          href={ROUTES.AUTH.SIGNIN}
          colorPalette="green"
          w={isCollapsed ? 'full' : '180px'}
          onClick={onClose}
          justifyContent="center"
          px={{ base: 4, md: isCollapsed ? 0 : 4 }}
        >
          <Flex align="center" gap={2} justifyContent="center">
            <LogIn size={16} />
            {!isCollapsed && <Text>{common('login')}</Text>}
          </Flex>
        </NextLinkButton>
      </VTooltip>

      <VTooltip
        content={common('register')}
        positioning={TOOLTIP_POSITIONING}
        disabled={!isCollapsed}
        showArrow
        openDelay={TOOLTIP_OPEN_DELAY}
      >
        <NextLinkButton
          href={ROUTES.AUTH.SIGNUP}
          variant="outline"
          colorPalette="green"
          w={isCollapsed ? 'full' : '180px'}
          onClick={onClose}
          justifyContent="center"
          px={{ base: 4, md: isCollapsed ? 0 : 4 }}
        >
          <Flex align="center" gap={2} justifyContent="center">
            <UserPlus size={16} />
            {!isCollapsed && <Text>{common('register')}</Text>}
          </Flex>
        </NextLinkButton>
      </VTooltip>
    </Stack>
  );
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const isCollapsed =
    useBreakpointValue({ base: false, md: isSidebarCollapsed }) ?? false;
  const pathname = usePathname();
  const [hasManagedVenues, setHasManagedVenues] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role === 'GUEST') {
      setHasManagedVenues(false);
      return;
    }
    VenueRentalService.getManagedVenues()
      .then((venues) => setHasManagedVenues(venues.length > 0))
      .catch(() => setHasManagedVenues(false));
  }, [isAuthenticated, user?.id, user?.role]);

  const ctx: NavContext = {
    user,
    isAuthenticated,
    canAccessHostFeatures,
    hasManagedVenues,
  };
  const t: NavTranslators = { nav, common };

  const showAuthActions =
    isHydrated &&
    !isLoading &&
    !isAuthenticated &&
    !pathname.includes('/auth/signin') &&
    !pathname.includes('/auth/signup');

  return (
    <>
      {/* Overlay - Mobile only */}
      {isOpen && (
        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          top={PANEL_TOP}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={1200}
          onClick={onClose}
        />
      )}

      {/* Slide-out Menu */}
      <Box
        position="fixed"
        top={PANEL_TOP}
        left={0}
        bottom={0}
        width={{
          base: '240px',
          md: isSidebarCollapsed
            ? `${SIDEBAR_WIDTH_COLLAPSED}px`
            : `${SIDEBAR_WIDTH_EXPANDED}px`,
        }}
        bg="bg"
        shadow="xl"
        zIndex={1250}
        transform={{
          base: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          md: 'translateX(0)',
        }}
        transition="width 0.3s ease, transform 0.3s ease"
        borderRight="1px solid"
        borderColor="border"
        overflowY="auto"
      >
        {/* Body */}
        <Box
          p={{ base: 4, md: isCollapsed ? 2 : 4 }}
          pb={{
            base: 'calc(1rem + env(safe-area-inset-bottom))',
            md: isCollapsed ? 2 : 4,
          }}
        >
          <Stack gap={3}>
            {/* Nav sections */}
            {NAV_SECTIONS.map((section) => {
              if (section.isVisible && !section.isVisible(ctx)) {
                return null;
              }

              return (
                <Fragment key={section.key}>
                  <Box>
                    {!isCollapsed && (
                      <SectionHeading>{section.title(t)}</SectionHeading>
                    )}
                    <Stack gap={2}>
                      {section.items.map((item) => {
                        if (item.isVisible && !item.isVisible(ctx)) {
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
                            href={item.getHref(ctx)}
                            label={item.label(t)}
                            icon={item.icon}
                            isActive={isNavLinkActive(item, pathname, ctx)}
                            isCollapsed={isCollapsed}
                            onClose={onClose}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                  <Separator />
                </Fragment>
              );
            })}

            {/* Language Switcher */}
            <SwitcherSection
              title={common('language')}
              isCollapsed={isCollapsed}
            >
              {(collapsed) => (
                <LanguageSwitcher
                  keepDrawerOpen={false}
                  isCollapsed={collapsed}
                />
              )}
            </SwitcherSection>

            {/* Theme Switcher */}
            <SwitcherSection title={common('theme')} isCollapsed={isCollapsed}>
              {(collapsed) => <ThemeSwitcher isCollapsed={collapsed} />}
            </SwitcherSection>

            {/* Footer */}
            <Box pt={4}>
              {showAuthActions && (
                <AuthActions isCollapsed={isCollapsed} onClose={onClose} />
              )}

              {!isCollapsed && (
                <>
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    {`© ${new Date().getFullYear()} ${common('appName')}. All Rights Reserved!`}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.400"
                    textAlign="center"
                    mt={1}
                  >
                    {common('developedBy')}
                  </Text>
                </>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
