'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Portal,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import {
  ChevronDown,
  User as UserIcon,
  MessageSquare,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Check,
  Languages,
  Moon,
  Sun,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import { useTranslations, useLocale } from 'next-intl';
import UserProfileModal from './UserProfileModal';
import { useRouter, usePathname } from '@/i18n/config';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';
import { useColorMode } from './color-mode-provider';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Use actual color mode from theme provider
  const { theme, setColorMode } = useColorMode();
  const currentTheme = theme;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset to main menu when closing
        setTimeout(() => setCurrentMenu('MAIN'), 200);
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
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen((prev) => !prev);
  };

  if (!user) return null;

  const handleProfileClick = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
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
      {/* Profile/Settings */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 3 }}
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
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium" flex={1}>
          {common('profile')}
        </Text>
      </Flex>

      {/* Appearance */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 3 }}
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
        <Box flex={1}>
          <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
            {common('appearance')}: {getThemeLabel(currentTheme)}
          </Text>
        </Box>
        <ChevronRight size={16} color="gray" />
      </Flex>

      {/* Language */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 3 }}
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
        <Box flex={1}>
          <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
            {common('displayLanguage')}: {getLanguageLabel(locale)}
          </Text>
        </Box>
        <ChevronRight size={16} color="gray" />
      </Flex>

      {/* AI Assistant */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 3 }}
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

      {/* Give Feedback */}
      <Flex
        align="center"
        gap={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 3 }}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
      >
        <Box
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          p={{ base: 1.5, md: 2 }}
          borderRadius="full"
        >
          <MessageSquare size={16} />
        </Box>
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
          {common('giveFeedback')}
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
        py={{ base: 2, md: 3 }}
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
              py={{ base: 2, md: 3 }}
              px={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => setColorMode(t.id as 'light' | 'dark' | 'system')}
              borderRadius="md"
            >
              <Box w={{ base: 4, md: 6 }}>
                {theme === t.id && (
                  <Check size={16} color="var(--chakra-colors-blue-500)" />
                )}
              </Box>
              <Text
                flex={1}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={theme === t.id ? 'semibold' : 'normal'}
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
          {SUPPORTED_LOCALES.map((l) => (
            <Flex
              key={l}
              align="center"
              gap={{ base: 2, md: 3 }}
              py={{ base: 2, md: 3 }}
              px={{ base: 3, md: 4 }}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => handleLanguageChange(l)}
              borderRadius="md"
            >
              <Box w={{ base: 4, md: 6 }}>
                {locale === l && (
                  <Check size={16} color="var(--chakra-colors-blue-500)" />
                )}
              </Box>
              <Text
                flex={1}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={locale === l ? 'semibold' : 'normal'}
              >
                {getLanguageLabel(l)}
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
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <Avatar.Root size="sm" bg="brand.500">
            <Avatar.Fallback name={user.name || user.email}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </Avatar.Fallback>
            {user.image && <Avatar.Image src={user.image} />}
          </Avatar.Root>
          {/* Dropdown Icon */}
          <Box
            position="absolute"
            bottom="-2px"
            right="-2px"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="full"
            p="2px"
            boxShadow="sm"
          >
            <ChevronDown size={12} />
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
                      <Text
                        fontSize="xs"
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                      >
                        {user.email}
                      </Text>
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

      {/* Profile Modal - rendered via Portal to escape dropdown positioning context */}
      <Portal>
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </Portal>
    </>
  );
}
