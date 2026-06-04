'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Flex, IconButton, Portal, Text } from '@chakra-ui/react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  House,
  Languages,
  LogIn,
  Menu,
  Monitor,
  Moon,
  Sun,
  UserPlus,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ROUTES } from '@/constants';
import { usePathname, useRouter } from '@/i18n/config';
import { Locale } from '@/i18n/locales';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';
import NotificationBell from '@/components/ui/NotificationBell';
import UserMenu from '@/components/ui/UserMenu';
import { useColorMode } from '@/components/ui/color-mode-provider';

type GuestMenuState = 'MAIN' | 'APPEARANCE' | 'LANGUAGE';

export default function TournamentTopBarMenu() {
  const common = useTranslations('common');
  const navigation = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { theme, setColorMode } = useColorMode();
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<GuestMenuState>('MAIN');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const handleLogout = () => {
    AuthService.logout();
    router.push(ROUTES.HOME);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    setCurrentMenu('MAIN');
  };

  const handleToggleMenu = () => {
    if (isMenuOpen) {
      handleCloseMenu();
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsMenuOpen(true);
  };

  const handleNavigate = (href: string) => {
    handleCloseMenu();
    router.push(href);
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    handleCloseMenu();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setColorMode(newTheme);
    handleCloseMenu();
  };

  const getThemeLabelShort = (currentTheme: 'light' | 'dark' | 'system') => {
    switch (currentTheme) {
      case 'dark':
        return common('darkMode');
      case 'light':
        return common('lightMode');
      case 'system':
        return common('systemMode');
      default:
        return common('systemMode');
    }
  };

  const getLanguageLabel = (currentLocale: string) => {
    switch (currentLocale) {
      case Locale.VI:
        return common('vietnamese');
      case Locale.EN:
        return common('english');
      case Locale.CN:
        return common('chinese');
      default:
        return currentLocale;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleCloseMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!isHydrated || isLoading) return null;

  if (!isAuthenticated) {
    return (
      <>
        <Box ref={buttonRef}>
          <IconButton
            aria-label={common('navigation')}
            onClick={handleToggleMenu}
            variant="ghost"
            color="fg"
            _hover={{ bg: 'bg.muted' }}
            borderRadius="full"
            size="md"
          >
            <Menu size={22} />
          </IconButton>
        </Box>

        {isMenuOpen && dropdownPos && (
          <Portal>
            <Box
              ref={menuRef}
              position="fixed"
              top={`${dropdownPos.top}px`}
              right={`${dropdownPos.right}px`}
              bg="white"
              borderRadius="lg"
              boxShadow="xl"
              minW={{ base: '220px', md: '260px' }}
              zIndex={9999}
              border="1px solid"
              borderColor="gray.200"
              overflow="hidden"
              py={currentMenu === 'MAIN' ? 1 : 0}
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            >
              {currentMenu === 'MAIN' && (
                <>
                  <GuestMenuItem
                    icon={<House size={17} />}
                    label={navigation('mainHome')}
                    onClick={() => handleNavigate(ROUTES.HOME)}
                    featured
                  />
                  <Box
                    h="1px"
                    bg="gray.100"
                    _dark={{ bg: 'gray.700' }}
                    my={1}
                  />
                  <GuestMenuItem
                    icon={<Moon size={16} />}
                    label={common('appearance')}
                    value={getThemeLabelShort(theme)}
                    onClick={() => setCurrentMenu('APPEARANCE')}
                    hasSubmenu
                  />
                  <GuestMenuItem
                    icon={<Languages size={16} />}
                    label={common('displayLanguage')}
                    value={getLanguageLabel(locale)}
                    onClick={() => setCurrentMenu('LANGUAGE')}
                    hasSubmenu
                  />
                  <Box
                    h="1px"
                    bg="gray.100"
                    _dark={{ bg: 'gray.700' }}
                    my={1}
                  />
                  <GuestMenuItem
                    icon={<LogIn size={16} />}
                    label={common('login')}
                    onClick={() => handleNavigate(ROUTES.AUTH.SIGNIN)}
                  />
                  <GuestMenuItem
                    icon={<UserPlus size={16} />}
                    label={common('register')}
                    onClick={() => handleNavigate(ROUTES.AUTH.SIGNUP)}
                  />
                </>
              )}
              {currentMenu === 'APPEARANCE' && (
                <GuestSubMenu
                  title={common('appearance')}
                  onBack={() => setCurrentMenu('MAIN')}
                >
                  {[
                    {
                      id: 'dark' as const,
                      label: common('darkTheme'),
                      icon: Moon,
                    },
                    {
                      id: 'light' as const,
                      label: common('lightTheme'),
                      icon: Sun,
                    },
                    {
                      id: 'system' as const,
                      label: common('systemMode'),
                      icon: Monitor,
                    },
                  ].map((item) => (
                    <GuestChoiceItem
                      key={item.id}
                      icon={<item.icon size={16} />}
                      label={item.label}
                      selected={theme === item.id}
                      onClick={() => handleThemeChange(item.id)}
                    />
                  ))}
                </GuestSubMenu>
              )}
              {currentMenu === 'LANGUAGE' && (
                <GuestSubMenu
                  title={common('displayLanguage')}
                  onBack={() => setCurrentMenu('MAIN')}
                >
                  {[
                    { id: Locale.VI, label: common('vietnamese') },
                    { id: Locale.EN, label: common('english') },
                    { id: Locale.CN, label: common('chinese') },
                  ].map((item) => (
                    <GuestChoiceItem
                      key={item.id}
                      icon={<Languages size={16} />}
                      label={item.label}
                      selected={locale === item.id}
                      onClick={() => handleLanguageChange(item.id)}
                    />
                  ))}
                </GuestSubMenu>
              )}
            </Box>
          </Portal>
        )}
      </>
    );
  }

  return (
    <Flex align="center" gap={2}>
      <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
      <UserMenu onLogout={handleLogout} />
    </Flex>
  );
}

function GuestMenuItem({
  icon,
  label,
  value,
  onClick,
  featured = false,
  hasSubmenu = false,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  featured?: boolean;
  hasSubmenu?: boolean;
}) {
  return (
    <Flex
      align="center"
      gap={3}
      mx={featured ? 2 : 0}
      px={featured ? 3 : 4}
      py={featured ? 3 : 2.5}
      cursor="pointer"
      borderRadius={featured ? 'md' : undefined}
      bg={featured ? 'green.50' : 'transparent'}
      color={featured ? 'green.700' : undefined}
      border={featured ? '1px solid' : undefined}
      borderColor={featured ? 'green.200' : undefined}
      _hover={{
        bg: featured ? 'green.100' : 'gray.50',
        _dark: { bg: featured ? 'green.900/30' : 'gray.700' },
      }}
      _dark={{
        bg: featured ? 'green.900/20' : 'transparent',
        color: featured ? 'green.200' : undefined,
        borderColor: featured ? 'green.700' : undefined,
      }}
      onClick={onClick}
    >
      <Box
        bg={featured ? 'green.100' : 'gray.100'}
        _dark={{ bg: featured ? 'green.800/60' : 'gray.700' }}
        p={2}
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {icon}
      </Box>
      <Text fontSize="md" fontWeight={featured ? 'bold' : 'medium'} flex={1}>
        {label}
      </Text>
      {value && (
        <Text fontSize="sm" color={featured ? 'green.600' : 'gray.500'}>
          {value}
        </Text>
      )}
      {hasSubmenu && <ChevronRight size={16} color="gray" />}
    </Flex>
  );
}

function GuestSubMenu({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <Box>
      <Flex
        align="center"
        p={2}
        borderBottom="1px solid"
        borderColor="gray.100"
        _dark={{ borderColor: 'gray.700' }}
      >
        <IconButton
          variant="ghost"
          aria-label="Back"
          onClick={onBack}
          size="sm"
          borderRadius="full"
        >
          <ArrowLeft size={16} />
        </IconButton>
        <Text ml={2} fontWeight="bold" fontSize="md">
          {title}
        </Text>
      </Flex>
      <Flex direction="column" gap={1} p={2}>
        {children}
      </Flex>
    </Box>
  );
}

function GuestChoiceItem({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Flex
      align="center"
      gap={3}
      px={3}
      py={2.5}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
      onClick={onClick}
    >
      <Box w={5} display="flex" justifyContent="center">
        {selected ? (
          <Check size={16} color="var(--chakra-colors-green-500)" />
        ) : (
          icon
        )}
      </Box>
      <Text
        flex={1}
        fontSize="md"
        fontWeight={selected ? 'semibold' : 'medium'}
        color={selected ? 'green.600' : undefined}
      >
        {label}
      </Text>
    </Flex>
  );
}
