'use client';

import { useCourtCallStore } from '@/stores/useCourtCallStore';
import CourtCallModal from '@/components/session/CourtCallModal';

export default function GlobalCourtCallModal() {
  const isOpen = useCourtCallStore((s) => s.isOpen);
  const courtName = useCourtCallStore((s) => s.courtName);
  const hideCourtCall = useCourtCallStore((s) => s.hideCourtCall);

  return (
    <CourtCallModal
      isOpen={isOpen}
      onClose={hideCourtCall}
      courtName={courtName}
    />
  );
}
