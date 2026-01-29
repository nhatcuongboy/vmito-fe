import { Metadata } from 'next';
import PublicSessionDetailClient from './PublicSessionDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Badminton Session',
    description: 'Join a badminton session',
  };
}

export default function PublicSessionDetailPage({ params }: PageProps) {
  return <PublicSessionDetailClient />;
}
