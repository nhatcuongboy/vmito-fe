'use client';

import { Box, Flex } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useFormatWizard } from '../FormatWizardContext';
import { useTranslations } from 'next-intl';

interface WizardFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  isConfirmLoading?: boolean;
}

export default function WizardFooter({
  onCancel,
  onConfirm,
  isConfirmLoading,
}: WizardFooterProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, totalSteps, goNext, goBack } = useFormatWizard();
  const { currentStep, selectedFormat } = state;

  const isLastStep = currentStep === totalSteps;
  const isNextDisabled = currentStep === 1 && !selectedFormat;

  const handlePrimaryClick = () => {
    if (isLastStep) {
      onConfirm();
    } else {
      goNext();
    }
  };

  const handleSecondaryClick = () => {
    if (currentStep === 1) {
      onCancel();
    } else {
      goBack();
    }
  };

  const primaryLabel = isLastStep ? t('confirm') : t('next');
  const secondaryLabel = currentStep === 1 ? t('cancel') : t('back');

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      bg="white"
      _dark={{ bg: 'gray.800' }}
      zIndex={1}
    >
      {/* Progress bar */}
      <Box bg="blue.100" _dark={{ bg: 'blue.900' }} h="4px">
        <Box
          bg="blue.500"
          h="full"
          w={`${(currentStep / totalSteps) * 100}%`}
          transition="width 0.3s ease"
        />
      </Box>

      <Flex
        justify="space-between"
        align="center"
        px={6}
        py={4}
        pb="calc(16px + env(safe-area-inset-bottom))"
      >
        <Button
          variant="ghost"
          colorPalette="gray"
          onClick={handleSecondaryClick}
          fontWeight="semibold"
        >
          {secondaryLabel}
        </Button>

        <Button
          bg="gray.900"
          color="white"
          colorPalette="gray"
          _hover={{ bg: 'gray.700' }}
          _dark={{
            bg: 'white',
            color: 'gray.900',
            _hover: { bg: 'gray.200' },
          }}
          onClick={handlePrimaryClick}
          disabled={isNextDisabled}
          loading={isConfirmLoading}
          px={8}
        >
          {primaryLabel}
        </Button>
      </Flex>
    </Box>
  );
}
