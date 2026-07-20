'use client';

import { Text, VStack } from '@chakra-ui/react';
import VModal from '@/components/ui/VModal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  actionText: string;
  cancelText: string;
  /** Renders the confirm button in red. Defaults to true. */
  isDestructive?: boolean;
  isLoading?: boolean;
  /** Shown inside the dialog so the reason stays next to the action. */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation prompt for destructive venue-rental actions. Mirrors the
 * pricing feature's delete flow: the dialog stays open on failure and renders
 * the error inline rather than stacking a second modal on top.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  body,
  actionText,
  cancelText,
  isDestructive = true,
  isLoading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <VModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={title}
      primaryActionText={actionText}
      primaryColorScheme={isDestructive ? 'red' : 'green'}
      secondaryActionText={cancelText}
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
