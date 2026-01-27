import BrowseSessionsClient from './BrowseSessionsClient';

// Enable ISR with 30 second revalidation
export const revalidate = 30;

// Server-side data fetching
async function getInitialSessions() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/sessions/available`, {
      next: { revalidate: 30 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch sessions:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('SSR fetch error:', error);
    return [];
  }
}

import { Suspense } from 'react';

export default async function FindSessionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initialSessions = await getInitialSessions();

  return (
    <Suspense>
      <BrowseSessionsClient locale={locale} initialSessions={initialSessions} />
    </Suspense>
  );
}
