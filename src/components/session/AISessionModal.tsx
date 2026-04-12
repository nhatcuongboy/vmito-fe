'use client';

import React, { useState } from 'react';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { VModal } from '@/components/ui/VModal';
import { AIService, ExtractedSessionData } from '@/lib/api/ai.service';
import { toaster } from '@/components/ui/toaster';
import { Locale } from '@/i18n/locales';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants';

export interface AISessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: ExtractedSessionData) => void;
}

export const AISessionModal: React.FC<AISessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations('session');
  const locale = useLocale() as Locale;
  const [articleContent, setArticleContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!articleContent.trim()) {
      toaster.error({ title: t('aiModal.emptyContent') });
      return;
    }

    setIsLoading(true);
    try {
      const extracted = await AIService.extractSessionFromArticle(
        articleContent,
        locale
      );
      toaster.success({ title: t('aiModal.success') });
      onSuccess(extracted);
      setArticleContent('');
      onClose();
    } catch (error) {
      console.error('AI extraction error:', error);
      toaster.error({ title: t('aiModal.error') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setArticleContent('');
      onClose();
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <Box display="flex" alignItems="center" gap={2}>
          <Sparkles size={20} color="#805AD5" />
          <Text>{t('aiModal.title')}</Text>
        </Box>
      }
      description={t('aiModal.description')}
      size="lg"
      primaryActionText={t('aiModal.generate')}
      onPrimaryAction={handleGenerate}
      isPrimaryLoading={isLoading}
      isPrimaryDisabled={!articleContent.trim()}
      primaryColorScheme="purple"
      secondaryActionText={t('aiModal.cancel')}
      closeOnOverlayClick={!isLoading}
    >
      <Box>
        <Textarea
          value={articleContent}
          onChange={(e) => setArticleContent(e.target.value)}
          placeholder={t('aiModal.placeholder')}
          rows={12}
          resize="vertical"
          disabled={isLoading}
          fontSize="sm"
          _focus={{
            borderColor: 'purple.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
          }}
        />
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
        >
          <Text fontSize="xs" color="gray.500">
            {t('aiModal.hint')}
          </Text>
          <Link
            href={ROUTES.SESSIONS.NEW}
            prefetch={false}
            style={{
              fontSize: '12px',
              color: 'var(--chakra-colors-purple-500)',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            {t('aiModal.manualLink')}
          </Link>
        </Box>
      </Box>
    </VModal>
  );
};

export default AISessionModal;
