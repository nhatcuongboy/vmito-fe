'use client';

import { VDrawer } from '@/components/ui/VDrawer';
import { PendingJoinRequestsPanel } from './PendingJoinRequestsPanel';
import { useTranslations } from 'next-intl';

interface HostPendingRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
  onMutated?: () => void | Promise<void>;
}

export default function HostPendingRequestsDrawer({
  isOpen,
  onClose,
  onCountChange,
  onMutated,
}: HostPendingRequestsDrawerProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');

  return (
    <VDrawer
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      title={t('pendingJoinRequests')}
      hideSecondaryAction
      closeButtonAriaLabel={tCommon('close')}
    >
      <PendingJoinRequestsPanel
        onCountChange={onCountChange}
        onMutated={onMutated}
      />
    </VDrawer>
  );
}
