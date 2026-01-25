'use client';

import React, { useState } from 'react';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { CommonModal } from '@/components/ui/CommonModal';
import { AIService, ExtractedSessionData } from '@/lib/api/ai.service';
import { toaster } from '@/components/ui/toaster';

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
        articleContent
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
    <CommonModal
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
        <Text fontSize="xs" color="gray.500" mt={2}>
          {t('aiModal.hint')}
        </Text>
      </Box>
    </CommonModal>
  );
};

export default AISessionModal;
