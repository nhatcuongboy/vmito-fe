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
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { VSwitch } from '@/components/ui/VSwitch';

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
  const { useAiForCreation, setUseAiForCreation } = usePreferenceStore();

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
      closeOnOverlayClick={!isLoading}
      footer={
        <Flex
          width="100%"
          justify="space-between"
          align="center"
          direction={{ base: 'column-reverse', sm: 'row' }}
          gap={3}
        >
          <Flex align="center" gap={2}>
            <VSwitch
              colorPalette="purple"
              size="sm"
              checked={useAiForCreation}
              onCheckedChange={(details) =>
                setUseAiForCreation(details.checked)
              }
            />
            <Text fontSize="xs" color="gray.600">
              {useAiForCreation
                ? t('aiModal.title')
                : t('aiModal.alwaysManual')}
            </Text>
          </Flex>
          <Flex
            gap={3}
            w={{ base: 'full', sm: 'auto' }}
            direction={{ base: 'column-reverse', sm: 'row' }}
          >
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              w={{ base: 'full', sm: 'auto' }}
            >
              {t('aiModal.cancel')}
            </Button>
            <Button
              colorPalette="purple"
              onClick={handleGenerate}
              loading={isLoading}
              disabled={!articleContent.trim() || isLoading}
              w={{ base: 'full', sm: 'auto' }}
            >
              {t('aiModal.generate')}
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
