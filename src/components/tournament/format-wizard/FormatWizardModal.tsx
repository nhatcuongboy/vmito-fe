'use client';

import React from 'react';
import { Box, Flex, Portal } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { FormatWizardProvider, useFormatWizard } from './FormatWizardContext';
import WizardFooter from './components/WizardFooter';
import StepSelectFormat from './steps/StepSelectFormat';
import StepConfigureFormat from './steps/StepConfigureFormat';
import StepConfigurePlayoffs from './steps/StepConfigurePlayoffs';
import StepConfirmation from './steps/StepConfirmation';
import { TournamentFormatType, FormatConfig } from './types';
import { getDefaultConfig } from './constants';

interface FormatWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (format: TournamentFormatType, config: FormatConfig) => void;
  initialFormat?: TournamentFormatType | null;
  initialConfig?: FormatConfig | null;
}

export default function FormatWizardModal({
  isOpen,
  onClose,
  onConfirm,
  initialFormat,
  initialConfig,
}: FormatWizardModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <FormatWizardProvider
        initialState={{
          selectedFormat: initialFormat,
          config:
            initialConfig ||
            (initialFormat ? getDefaultConfig(initialFormat) : null),
          currentStep: initialFormat ? 2 : 1,
        }}
      >
        <WizardContent onClose={onClose} onConfirm={onConfirm} />
      </FormatWizardProvider>
    </Portal>
  );
}

function WizardContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (format: TournamentFormatType, config: FormatConfig) => void;
}) {
  const { state, reset } = useFormatWizard();

  const handleClose = React.useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  // Escape key handler
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  const handleConfirm = () => {
    if (state.selectedFormat && state.config) {
      onConfirm(state.selectedFormat, state.config);
      reset();
      onClose();
    }
  };

  const isRRToSE =
    state.selectedFormat === TournamentFormatType.ROUND_ROBIN_TO_SE;
  const confirmStep = isRRToSE ? 4 : 3;
  const playoffsStep = isRRToSE ? 3 : -1; // only exists for RRSE

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={1500}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={handleClose}
      animation="fadeIn 0.15s ease-out"
      css={{
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        w="full"
        maxW="1100px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        position="relative"
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
        animation="slideIn 0.15s ease-out"
        css={{
          '@keyframes slideIn': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Close button */}
        <Flex
          as="button"
          position="absolute"
          top={4}
          right={4}
          zIndex={10}
          px={4}
          py={2}
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
          bg="white"
          color="gray.700"
          fontWeight="medium"
          fontSize="sm"
          cursor="pointer"
          _hover={{ bg: 'gray.50' }}
          onClick={handleClose}
          align="center"
          gap={1}
        >
          <X size={16} />
          Close
        </Flex>

        {/* Content area */}
        <Box flex={1} overflow="hidden" pb="80px">
          {state.currentStep === 1 && <StepSelectFormat />}
          {state.currentStep === 2 && <StepConfigureFormat />}
          {state.currentStep === playoffsStep && <StepConfigurePlayoffs />}
          {state.currentStep === confirmStep && <StepConfirmation />}
        </Box>

        {/* Footer */}
        <WizardFooter onCancel={handleClose} onConfirm={handleConfirm} />
      </Box>
    </Box>
  );
}
