'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import PublicUserProfileContent from '@/components/player/PublicUserProfileContent';

function PublicUserProfilePageContent() {
  const params = useParams();
  const userId = params.userId as string;
  return <PublicUserProfileContent userId={userId} />;
}

export default function PublicUserProfilePage() {
  return (
    <Suspense>
      <PublicUserProfilePageContent />
    </Suspense>
  );
}
