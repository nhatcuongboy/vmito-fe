'use client';

import BugReportModal from '@/components/feedback/BugReportModal';
import ContactModal from '@/components/feedback/ContactModal';
import { VModal } from '@/components/ui/VModal';
import { ROUTES } from '@/constants/routes';
import { usePathname, useRouter } from '@/i18n/config';
import { Locale } from '@/i18n/locales';
import { UserRole } from '@/lib/api/types';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  BookOpen,
  Bug,
  Check,
  ChevronRight,
  House,
  Languages,
  LogOut,
  Menu as MenuIcon,
  MessageCircle,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useColorMode } from './color-mode-provider';

interface UserMenuProps {
  onLogout: () => void;
}

type MenuState = 'MAIN' | 'APPEARANCE' | 'LANGUAGE';

export default function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuthStore();
  const common = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<MenuState>('MAIN');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Use actual color mode from theme provider
  const { theme, setColorMode } = useColorMode();
  const currentTheme = theme;

  const handleCloseMenu = () => {
    setIsOpen(false);
    setCurrentMenu('MAIN');
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

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    if (isOpen) {
      handleCloseMenu();
      return;
    }

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(true);
  };

  if (!user) return null;

  const handleProfileClick = () => {
    setIsOpen(false);
    if (user) {
      router.push(ROUTES.USER.PROFILE(user.id));
    }
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setCurrentMenu('MAIN');
    setIsLogoutConfirmOpen(true);
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
    setCurrentMenu('MAIN');
  };

  const getThemeLabel = (theme: 'light' | 'dark' | 'system') => {
    switch (theme) {
      case 'dark':
        return common('darkTheme');
      case 'light':
        return common('lightTheme');
      case 'system':
        return common('deviceTheme');
      default:
        return common('deviceTheme');
    }
  };

  const getThemeLabelShort = (theme: 'light' | 'dark' | 'system') => {
    switch (theme) {
      case 'dark':
        return 'Tối';
      case 'light':
        return 'Sáng';
      case 'system':
        return 'Tự động';
      default:
        return 'Tự động';
    }
  };

  const getLanguageLabel = (l: string) => {
    switch (l) {
      case Locale.VI:
        return common('vietnamese');
      case Locale.EN:
        return common('english');
      case Locale.CN:
        return common('chinese');
      default:
        return l;
    }
  };

  const renderMainMenu = () => (
    <Box py={{ base: 1, md: 2 }}>
      {/* Profile/Settings - Temporarily Hidden */}
      <Box display="none">
        <Flex
          align="center"
          gap={{ base: 2, md: 3 }}
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 2 }}
          cursor="pointer"
          _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
          onClick={handleProfileClick}
        >
          <Box
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
            p={{ base: 1.5, md: 2 }}
            borderRadius="full"
          >
            <UserIcon size={16} />
          </Box>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="medium"
            flex={1}
          >
            {common('profile')}
          </Text>
        </Flex>
      </Box>

      {/* Home */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => {
          setIsOpen(false);
          router.push(ROUTES.HOME);
        }}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <House size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('mainHome')}
        </Text>
      </Flex>

      {/* Appearance */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => setCurrentMenu('APPEARANCE')}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <Moon size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('appearance')}
        </Text>
        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="medium"
          color="gray.500"
          mr={1}
        >
          {getThemeLabelShort(currentTheme)}
        </Text>
        <ChevronRight size={16} color="gray" />
      </Flex>

      {/* Language */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => setCurrentMenu('LANGUAGE')}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <Languages size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('displayLanguage')}
        </Text>
        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="medium"
          color="gray.500"
          mr={1}
        >
          {getLanguageLabel(locale)}
        </Text>
        <ChevronRight size={16} color="gray" />
      </Flex>

      {/* AI Assistant */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => {
          setIsOpen(false);
          useAiAssistantStore.getState().open();
        }}
      >
        <Box
          bg="purple.50"
          _dark={{ bg: 'purple.900/40' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <Sparkles size={16} color="var(--chakra-colors-purple-500)" />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('aiAssistant')}
        </Text>
      </Flex>

      {/* Divider before Guide */}
      <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} my={2} />

      {/* Guide */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => {
          setIsOpen(false);
          router.push(ROUTES.GUIDE);
        }}
      >
        <Box
          bg="gray.50"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <BookOpen size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('guide')}
        </Text>
      </Flex>

      {/* Give Feedback - Contact */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => {
          setIsOpen(false);
          setIsContactModalOpen(true);
        }}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <MessageCircle size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
          {common('contact')}
        </Text>
      </Flex>

      {/* Bug Report */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => {
          setIsOpen(false);
          setIsBugReportModalOpen(true);
        }}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <Bug size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
          {common('bugReport')}
        </Text>
      </Flex>

      {/* Separator */}
      <Box
        h="1px"
        bg="gray.200"
        _dark={{ bg: 'gray.700' }}
        my={{ base: 1, md: 2 }}
      />

      {/* Logout */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={handleLogoutClick}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <LogOut size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
          {common('logout')}
        </Text>
      </Flex>
    </Box>
  );

  const renderAppearanceMenu = () => (
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
          onClick={() => setCurrentMenu('MAIN')}
          size="sm"
          borderRadius="full"
        >
          <ArrowLeft size={16} />
        </IconButton>
        <Text ml={2} fontWeight="bold" fontSize={{ base: 'sm', md: 'lg' }}>
          {common('appearance')}
        </Text>
      </Flex>
      <Box p={{ base: 2, md: 4 }}>
        <Text
          fontSize={{ base: 'xs', md: 'sm' }}
          color="gray.500"
          mb={{ base: 2, md: 4 }}
        >
          {common('displayOptionsSubtitle')}
        </Text>
        <Flex direction="column" gap={1}>
          {[
            { id: 'dark', label: common('darkTheme'), icon: Moon },
            { id: 'light', label: common('lightTheme'), icon: Sun },
            { id: 'system', label: common('systemMode'), icon: Monitor },
          ].map((t) => (
            <Flex
              key={t.id}
              align="center"
              gap={{ base: 2, md: 3 }}
              py={{ base: 2, md: 2 }}
              px={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => setColorMode(t.id as 'light' | 'dark' | 'system')}
              borderRadius="md"
            >
              <Box w={{ base: 4, md: 6 }}>
                {theme === t.id ? (
                  <Check size={16} color="var(--chakra-colors-blue-500)" />
                ) : (
                  <t.icon size={16} color="gray" />
                )}
              </Box>
              <Text
                flex={1}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={theme === t.id ? 'semibold' : 'normal'}
                color={theme === t.id ? 'blue.500' : undefined}
              >
                {t.label}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );

  const renderLanguageMenu = () => (
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
          onClick={() => setCurrentMenu('MAIN')}
          size="sm"
          borderRadius="full"
        >
          <ArrowLeft size={16} />
        </IconButton>
        <Text ml={2} fontWeight="bold" fontSize={{ base: 'sm', md: 'lg' }}>
          {common('displayLanguage')}
        </Text>
      </Flex>
      <Box p={2}>
        <Flex direction="column" gap={1}>
          {(
            [
              { locale: 'vi', flag: '🇻🇳' },
              { locale: 'en', flag: '🇬🇧' },
              { locale: 'cn', flag: '🇨🇳' },
            ] as { locale: string; flag: string }[]
          ).map((item) => (
            <Flex
              key={item.locale}
              align="center"
              gap={{ base: 2, md: 3 }}
              py={{ base: 2, md: 2 }}
              px={{ base: 3, md: 4 }}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => handleLanguageChange(item.locale)}
              borderRadius="md"
            >
              <Box w={{ base: 4, md: 6 }}>
                {locale === item.locale ? (
                  <Check size={16} color="var(--chakra-colors-blue-500)" />
                ) : (
                  <Text fontSize="md" lineHeight={1}>
                    {item.flag}
                  </Text>
                )}
              </Box>
              <Text
                flex={1}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={locale === item.locale ? 'semibold' : 'normal'}
                color={locale === item.locale ? 'blue.500' : undefined}
              >
                {getLanguageLabel(item.locale)}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );

  return (
    <>
      <Box position="relative" ref={buttonRef}>
        {/* Avatar Button */}
        <Box
          position="relative"
          cursor="pointer"
          onClick={handleToggleOpen}
          transition="all 0.2s ease"
          _hover={{
            transform: 'translateY(-1px)',
            '& .avatar-wrapper': {
              boxShadow: isOpen
                ? '0 6px 16px rgba(34,197,94,0.26)'
                : '0 4px 12px rgba(0,0,0,0.12)',
            },
          }}
          _active={{ transform: 'translateY(0) scale(0.96)' }}
        >
          <Box
            className="avatar-wrapper"
            borderRadius="full"
            border="2px solid"
            borderColor={isOpen ? 'green.500' : 'transparent'}
            boxShadow={isOpen ? '0 4px 12px rgba(34,197,94,0.28)' : 'none'}
            transition="all 0.2s ease"
            _dark={{
              borderColor: isOpen ? 'green.400' : 'transparent',
            }}
          >
            <Avatar.Root size="sm" bg="brand.500">
              <Avatar.Fallback name={user.name || user.email}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </Avatar.Fallback>
              {user.image && <Avatar.Image src={user.image} />}
            </Avatar.Root>
          </Box>
          {/* Dropdown Icon */}
          <Box
            position="absolute"
            bottom="-4px"
            right="-4px"
            bg="white"
            borderRadius="full"
            p="3px"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
          >
            <MenuIcon size={12} strokeWidth={2.5} />
          </Box>
        </Box>
      </Box>

      {/* Dropdown Menu - rendered via Portal to escape TopBar stacking context */}
      {isOpen && dropdownPos && (
        <Portal>
          <Box
            ref={menuRef}
            position="fixed"
            top={`${dropdownPos.top}px`}
            right={`${dropdownPos.right}px`}
            bg="white"
            borderRadius="lg"
            boxShadow="xl"
            minW={{ base: '260px', md: '320px' }}
            zIndex={9999}
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            {currentMenu === 'MAIN' && (
              <>
                {/* User Info Section */}
                <Box
                  p={{ base: 2, md: 3 }}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                  onClick={handleProfileClick}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.700' }}
                >
                  <Flex align="center" gap={{ base: 2, md: 3 }}>
                    <Avatar.Root size={{ base: 'sm', md: 'md' }} bg="brand.500">
                      <Avatar.Fallback name={user.name || user.email}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                      {user.image && <Avatar.Image src={user.image} />}
                    </Avatar.Root>
                    <Box flex={1}>
                      <Flex align="center" gap={2}>
                        <Text
                          fontSize={{ base: 'sm', md: 'md' }}
                          fontWeight="semibold"
                        >
                          {user.name || 'User'}
                        </Text>
                        {user.role === UserRole.HOST && (
                          <Badge
                            colorPalette="green"
                            size="sm"
                            fontSize="xs"
                            borderRadius="md"
                          >
                            {common('roleHost')}
                          </Badge>
                        )}
                        {user.role === UserRole.ADMIN && (
                          <Badge
                            colorPalette="purple"
                            size="sm"
                            fontSize="xs"
                            borderRadius="md"
                          >
                            {common('roleAdmin')}
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
                {renderMainMenu()}
              </>
            )}
            {currentMenu === 'APPEARANCE' && renderAppearanceMenu()}
            {currentMenu === 'LANGUAGE' && renderLanguageMenu()}
          </Box>
        </Portal>
      )}

      {/* Feedback Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      <BugReportModal
        isOpen={isBugReportModalOpen}
        onClose={() => setIsBugReportModalOpen(false)}
      />

      {/* Logout Confirm */}
      <VModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title={common('logoutConfirmTitle')}
        primaryActionText={common('logout')}
        onPrimaryAction={() => {
          setIsLogoutConfirmOpen(false);
          onLogout();
        }}
        primaryColorScheme="red"
        secondaryActionText={common('cancel')}
        size="sm"
        isCentered
      >
        <Text>{common('logoutConfirmMessage')}</Text>
      </VModal>
    </>
  );
}
