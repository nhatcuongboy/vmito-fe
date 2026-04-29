'use client';

import React, { useState } from 'react';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, SquarePen } from 'lucide-react';
import { VModal } from '@/components/ui/VModal';
import { AIService, ExtractedSessionData } from '@/lib/api/ai.service';
import { toaster } from '@/components/ui/toaster';
import { Locale } from '@/i18n/locales';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { Flex } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';

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
  const router = useRouter();
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

  const handleManualCreate = () => {
    if (!isLoading) {
      setArticleContent('');
      onClose();
      router.push(ROUTES.SESSIONS.NEW);
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
      closeOnOverlayClick={!isLoading}
      footer={
        <Flex
          width="100%"
          justify="center"
          align="center"
          direction="column"
          gap={3}
          pb={2}
        >
          <Button
            colorPalette="purple"
            onClick={handleGenerate}
            loading={isLoading}
            disabled={articleContent.trim() === '' || isLoading}
            size="md"
            fontWeight="bold"
            w="full"
          >
            <Sparkles size={16} />
            {t('aiModal.generate')}
          </Button>

          <Flex direction="column" align="center" gap={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              {t('aiModal.or')}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualCreate}
              disabled={isLoading}
              color="purple.600"
              _hover={{ bg: 'purple.50' }}
              fontWeight="semibold"
            >
              <SquarePen size={16} />
              {t('aiModal.alwaysManual')}
            </Button>
          </Flex>
        </Flex>
      }
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
        <Box mt={2}>
          <Text fontSize="xs" color="gray.500">
            {t('aiModal.hint')}
          </Text>
        </Box>
      </Box>
    </VModal>
  );
};

export default AISessionModal;
