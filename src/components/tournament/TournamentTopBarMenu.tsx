'use client';

import { useState } from 'react';
import { Flex, IconButton } from '@chakra-ui/react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/constants';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';
import NotificationBell from '@/components/ui/NotificationBell';
import SlideOutMenu from '@/components/ui/SlideOutMenu';
import UserMenu from '@/components/ui/UserMenu';

export default function TournamentTopBarMenu() {
  const common = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
    router.push(ROUTES.HOME);
  };

  if (!isHydrated || isLoading) return null;

  if (!isAuthenticated) {
    return (
      <>
        <IconButton
          aria-label={common('navigation')}
          onClick={() => setIsMenuOpen(true)}
          variant="ghost"
          color="fg"
          _hover={{ bg: 'bg.muted' }}
          borderRadius="full"
          size="md"
        >
          <Menu size={22} />
        </IconButton>
        <SlideOutMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
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
