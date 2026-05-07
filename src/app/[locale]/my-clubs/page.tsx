'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/config';

export default function MyClubsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-clubs/managing');
  }, [router]);

  return null;
}
