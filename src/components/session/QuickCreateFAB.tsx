'use client';

import React, { useState, useEffect } from 'react';
import { Box, Icon } from '@chakra-ui/react';
import { VTooltip } from '@/components/ui/VTooltip';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AISessionModal } from './AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { useRouter, usePathname } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import dynamic from 'next/dynamic';

const LoginPromptModal = dynamic(() => import('../auth/LoginPromptModal'), {
  ssr: false,
});

interface QuickCreateFABProps {
  bottom?: string | number;
  right?: string | number;
}

export const QuickCreateFAB: React.FC<QuickCreateFABProps> = ({
  bottom = '160px',
  right = '4',
}) => {
  const t = useTranslations('session');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  // After login, if action=openAIModal is in URL, open the AI modal
  useEffect(() => {
    if (user && searchParams.get('action') === 'openAIModal') {
      setIsOpen(true);
      // Clean the URL param without re-render
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  }, [user, searchParams, pathname, router]);

  const handleSuccess = (data: ExtractedSessionData) => {
    // Save AI-extracted data to sessionStorage so SessionForm can pick it up
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    router.push(ROUTES.SESSIONS.NEW);
  };

  const handleOpenAIModal = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <Box position="fixed" bottom={bottom} right={right} zIndex={1001}>
        <VTooltip content={t('quickCreate.aiPlaceholder')}>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxSize="56px"
            borderRadius="full"
            bg="purple.500"
            color="white"
            boxShadow="0 4px 14px rgba(128, 90, 213, 0.4)"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              transform: 'scale(1.1)',
              bg: 'purple.600',
              boxShadow: '0 6px 20px rgba(128, 90, 213, 0.6)',
            }}
            _active={{ transform: 'scale(0.95)' }}
            onClick={handleOpenAIModal}
            aria-label={t('quickCreate.aiPlaceholder')}
          >
            <Icon as={Sparkles} boxSize={7} />
          </Box>
        </VTooltip>
      </Box>

      <AISessionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Lazy load login prompt */}
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('loginRequiredCreateSessionAI')}
          returnUrl="/?action=openAIModal"
        />
      )}
    </>
  );
};

export default QuickCreateFAB;
