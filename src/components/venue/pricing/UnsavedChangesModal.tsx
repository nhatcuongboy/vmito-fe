'use client';

import { Dialog, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onCancel,
  onDiscard,
}: UnsavedChangesModalProps) {
  const t = useTranslations('adminVenuePricing');
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
      role="alertdialog"
      closeOnInteractOutside={false}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop zIndex={1700} />
        <Dialog.Positioner zIndex={1701} p={4}>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>{t('unsavedTitle')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>{t('unsavedDescription')}</Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('continueEditing')}
              </Button>
              <Button type="button" colorPalette="red" onClick={onDiscard}>
                {t('discardChanges')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
