'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Portal,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import {
  ChevronDown,
  User as UserIcon,
  Monitor,
  MessageSquare,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Check,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations, useLocale } from 'next-intl';
import UserProfileModal from './UserProfileModal';
import { useRouter, usePathname } from '@/i18n/config';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Use actual color mode from theme provider
  const { colorMode, setColorMode } = useColorMode();
  const currentTheme = colorMode;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const getThemeLabel = (theme: 'light' | 'dark') => {
    switch (theme) {
      case 'dark':
        return common('darkTheme');
      case 'light':
        return common('lightTheme');
      default:
        return common('lightTheme');
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
    <Box py={2}>
      {/* Profile/Settings */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={handleProfileClick}
      >
        <Box bg="gray.100" _dark={{ bg: 'gray.700' }} p={2} borderRadius="full">
          <UserIcon size={20} />
        </Box>
        <Text fontSize="md" fontWeight="medium" flex={1}>
          {common('profile')}
        </Text>
      </Flex>

      {/* Appearance */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => setCurrentMenu('APPEARANCE')}
      >
        <Box bg="gray.100" _dark={{ bg: 'gray.700' }} p={2} borderRadius="full">
          <Moon size={20} />
        </Box>
        <Box flex={1}>
          <Text fontSize="md" fontWeight="medium">
            {common('appearance')}: {getThemeLabel(currentTheme)}
          </Text>
        </Box>
        <ChevronRight size={20} color="gray" />
      </Flex>

      {/* Language */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={() => setCurrentMenu('LANGUAGE')}
      >
        <Box bg="gray.100" _dark={{ bg: 'gray.700' }} p={2} borderRadius="full">
          <Languages size={20} />
        </Box>
        <Box flex={1}>
          <Text fontSize="md" fontWeight="medium">
            {common('displayLanguage')}: {getLanguageLabel(locale)}
          </Text>
        </Box>
        <ChevronRight size={20} color="gray" />
      </Flex>

      {/* Give Feedback */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
      >
        <Box bg="gray.100" _dark={{ bg: 'gray.700' }} p={2} borderRadius="full">
          <MessageSquare size={20} />
        </Box>
        <Text fontSize="md" fontWeight="medium">
          {common('giveFeedback')}
        </Text>
      </Flex>

      {/* Separator */}
      <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} my={2} />

      {/* Logout */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        onClick={handleLogoutClick}
      >
        <Box bg="gray.100" _dark={{ bg: 'gray.700' }} p={2} borderRadius="full">
          <LogOut size={20} />
        </Box>
        <Text fontSize="md" fontWeight="medium">
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
          <ArrowLeft size={20} />
        </IconButton>
        <Text ml={2} fontWeight="bold" fontSize="lg">
          {common('appearance')}
        </Text>
      </Flex>
      <Box p={4}>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {common('displayOptionsSubtitle')}
        </Text>
        <Flex direction="column" gap={1}>
          {[
            { id: 'dark', label: common('darkTheme'), icon: Moon },
            { id: 'light', label: common('lightTheme'), icon: Sun },
          ].map((theme) => (
            <Flex
              key={theme.id}
              align="center"
              gap={3}
              py={3}
              px={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => setColorMode(theme.id as 'light' | 'dark')}
              borderRadius="md"
            >
              <Box w={6}>
                {currentTheme === theme.id && (
                  <Check size={20} color="var(--chakra-colors-blue-500)" />
                )}
              </Box>
              <Text
                flex={1}
                fontWeight={currentTheme === theme.id ? 'semibold' : 'normal'}
              >
                {theme.label}
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
          <ArrowLeft size={20} />
        </IconButton>
        <Text ml={2} fontWeight="bold" fontSize="lg">
          {common('displayLanguage')}
        </Text>
      </Flex>
      <Box p={2}>
        <Flex direction="column" gap={1}>
          {SUPPORTED_LOCALES.map((l) => (
            <Flex
              key={l}
              align="center"
              gap={3}
              py={3}
              px={4}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={() => handleLanguageChange(l)}
              borderRadius="md"
            >
              <Box w={6}>
                {locale === l && (
                  <Check size={20} color="var(--chakra-colors-blue-500)" />
                )}
              </Box>
              <Text flex={1} fontWeight={locale === l ? 'semibold' : 'normal'}>
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
      <Box position="relative" ref={menuRef}>
        {/* Avatar Button */}
        <Box
          position="relative"
          cursor="pointer"
          onClick={() => setIsOpen(!isOpen)}
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <Avatar.Root size="sm" bg="blue.500">
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

        {/* Dropdown Menu */}
        {isOpen && (
          <Box
            position="absolute"
            top="calc(100% + 8px)"
            right={0}
            bg="white"
            borderRadius="lg"
            boxShadow="xl"
            minW="320px"
            zIndex={2000}
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            {currentMenu === 'MAIN' && (
              <>
                {/* User Info Section */}
                <Box
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                  onClick={handleProfileClick}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.700' }}
                >
                  <Flex align="center" gap={3}>
                    <Avatar.Root size="md" bg="blue.500">
                      <Avatar.Fallback name={user.name || user.email}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                      {user.image && <Avatar.Image src={user.image} />}
                    </Avatar.Root>
                    <Box flex={1}>
                      <Text fontSize="md" fontWeight="semibold">
                        {user.name || 'User'}
                      </Text>
                      <Text
                        fontSize="sm"
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
        )}
      </Box>

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
