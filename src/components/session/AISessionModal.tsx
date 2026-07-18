'use client';

import React, { useEffect, useId, useState } from 'react';
import { Box, Field, Flex, Text, Textarea } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Sparkles, SquarePen } from 'lucide-react';
import { VModal } from '@/components/ui/VModal';
import { AIService, ExtractedSessionData } from '@/lib/api/ai.service';
import { toaster } from '@/components/ui/toaster';
import { Locale } from '@/i18n/locales';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/chakra-compat';
import {
  AI_SESSION_CONTENT_TEMPLATES,
  AiSessionContentTemplateId,
  hasUnresolvedTemplatePlaceholders,
} from './aiSessionContentTemplates';

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
  const articleContentId = useId();
  const [articleContent, setArticleContent] = useState('');
  const [exampleDate, setExampleDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const dateLocale =
      locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US';

    setExampleDate(
      new Intl.DateTimeFormat(dateLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date())
    );
  }, [locale]);

  const handleGenerate = async () => {
    if (!articleContent.trim()) {
      toaster.error({ title: t('aiModal.emptyContent') });
      return;
    }

    if (hasUnresolvedTemplatePlaceholders(articleContent)) {
      toaster.warning({ title: t('aiModal.unresolvedPlaceholdersWarning') });
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

  const handleTemplateSelect = (templateId: AiSessionContentTemplateId) => {
    const template = AI_SESSION_CONTENT_TEMPLATES.find(
      (item) => item.id === templateId
    );

    if (!template) return;

    setArticleContent(t(template.contentKey));
    toaster.success({ title: t('aiModal.templateInserted') });
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
      closeButtonAriaLabel={t('aiModal.close')}
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
            {isLoading ? t('aiModal.generating') : t('aiModal.generate')}
          </Button>

          <Flex direction="column" align="center" gap={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              {t('aiModal.manualPrompt')}
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
      <Box display="flex" flexDirection="column" gap={4}>
        <Field.Root>
          <Field.Label
            htmlFor={articleContentId}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={3}
            width="full"
          >
            <Text flex="1">{t('aiModal.inputLabel')}</Text>
            {articleContent.trim() === '' ? (
              <Flex justify="flex-end" marginStart="auto">
                {AI_SESSION_CONTENT_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    size="xs"
                    variant="outline"
                    colorPalette="purple"
                    disabled={isLoading}
                    aria-pressed="false"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <FileText size={14} />
                    {t('aiModal.templateAction')}
                  </Button>
                ))}
              </Flex>
            ) : null}
          </Field.Label>
          <Textarea
            id={articleContentId}
            value={articleContent}
            onChange={(e) => setArticleContent(e.target.value)}
            placeholder={t('aiModal.placeholder', { date: exampleDate })}
            rows={8}
            minH={{ base: '220px', md: '260px' }}
            resize="vertical"
            disabled={isLoading}
            fontSize="sm"
            lineHeight="tall"
            _placeholder={{ color: 'gray.400' }}
            _focus={{
              borderColor: 'purple.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
            }}
          />
          <Field.HelperText color="gray.500">
            {t('aiModal.hint')}
          </Field.HelperText>
        </Field.Root>
      </Box>
    </VModal>
  );
};

export default AISessionModal;
