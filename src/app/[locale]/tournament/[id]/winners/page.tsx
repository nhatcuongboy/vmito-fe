'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';

// The "Nhà vô địch" (champions) section now lives on the tournament home page,
// so the standalone winners tab/route has been removed. Redirect any old links
// (bookmarks, shared URLs) to home rather than 404.
export default function TournamentWinnersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;

  useEffect(() => {
    router.replace(`/tournament/${slug}`);
  }, [router, slug]);

  return null;
}
