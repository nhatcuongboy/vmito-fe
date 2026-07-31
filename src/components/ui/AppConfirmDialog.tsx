'use client';

import { Text, VStack } from '@chakra-ui/react';
import VModal from '@/components/ui/VModal';

interface IAppConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  colorPalette?: 'green' | 'red';
  isLoading?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function AppConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel,
  colorPalette = 'red',
  isLoading = false,
  error,
  onConfirm,
  onClose,
}: IAppConfirmDialogProps) {
  return (
    <VModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={title}
      primaryActionText={confirmLabel}
      primaryColorScheme={colorPalette}
      secondaryActionText={cancelLabel}
      onPrimaryAction={onConfirm}
      isPrimaryLoading={isLoading}
      isPrimaryDisabled={isLoading}
      isSecondaryDisabled={isLoading}
      closeOnOverlayClick={!isLoading}
    >
      <VStack align="stretch" gap={3}>
        <Text>{body}</Text>
        {error && (
          <Text color="red.600" fontSize="sm" role="alert" aria-live="polite">
            {error}
          </Text>
        )}
      </VStack>
    </VModal>
  );
}
