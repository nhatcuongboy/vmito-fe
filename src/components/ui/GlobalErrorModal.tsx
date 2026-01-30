'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Text } from '@chakra-ui/react';
import { CommonModal } from './CommonModal';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from 'next-intl';

export function GlobalErrorModal() {
  const t = useTranslations('common');
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);

  const isOpen = !!error;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={clearError}
      title={t('error')}
      primaryActionText={t('close')}
      onPrimaryAction={clearError}
      hideSecondaryAction
      isCentered
      size="sm"
    >
      <Text color="red.500" whiteSpace="pre-wrap">
        {error}
      </Text>
    </CommonModal>
  );
}
