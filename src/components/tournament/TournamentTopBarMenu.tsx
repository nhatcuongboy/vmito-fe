'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Flex, IconButton, Portal, Text } from '@chakra-ui/react';
import { House, LogIn, Menu, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';
import NotificationBell from '@/components/ui/NotificationBell';
import UserMenu from '@/components/ui/UserMenu';

export default function TournamentTopBarMenu() {
  const common = useTranslations('common');
  const navigation = useTranslations('navigation');
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleCloseMenu = () => setIsMenuOpen(false);

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
              py={1}
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            >
              <GuestMenuItem
                icon={<House size={16} />}
                label={navigation('mainHome')}
                onClick={() => handleNavigate(ROUTES.HOME)}
              />
              <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} my={1} />
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
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={2.5}
      cursor="pointer"
      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
      onClick={onClick}
    >
      <Box
        bg="gray.100"
        _dark={{ bg: 'gray.700' }}
        p={2}
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {icon}
      </Box>
      <Text fontSize="md" fontWeight="medium">
        {label}
      </Text>
    </Flex>
  );
}
