import JoinSessionClient from './JoinSessionClient';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function JoinSessionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense>
      <JoinSessionClient id={id} />
    </Suspense>
  );
}
