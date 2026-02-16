'use client';

import React, { useState } from 'react';
import { Box, Icon } from '@chakra-ui/react';
import { VTooltip } from '@/components/ui/VTooltip';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AISessionModal } from './AISessionModal';
import { ExtractedSessionData } from '@/lib/api/ai.service';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';

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
  const router = useRouter();
  const { user } = useAuthStore();

  if (!user) return null;

  const handleSuccess = (data: ExtractedSessionData) => {
    // Redirect to create session page with AI-extracted data
    const queryParams = new URLSearchParams({
      aiData: JSON.stringify(data),
    });
    router.push(`${ROUTES.SESSIONS.NEW}?${queryParams.toString()}`);
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
            onClick={() => setIsOpen(true)}
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
    </>
  );
};

export default QuickCreateFAB;
