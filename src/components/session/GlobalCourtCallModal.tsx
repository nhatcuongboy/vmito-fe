'use client';

import { useCourtCallStore } from '@/stores/useCourtCallStore';
import dynamic from 'next/dynamic';

// Only shown when a court-call socket event fires — no need in initial bundle
const CourtCallModal = dynamic(
  () => import('@/components/session/CourtCallModal'),
  { ssr: false }
);

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
