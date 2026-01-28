import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SessionService } from '@/lib/api/session.service';
import PublicSessionDetailClient from './PublicSessionDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const session = await SessionService.getSession(resolvedParams.id);

    return {
      title: `${session.name} - Badminton Session`,
      description: session.description || `Join ${session.name} hosted by ${session.host.name}`,
    };
  } catch (error) {
    return {
      title: 'Session Not Found',
    };
  }
}

export default async function PublicSessionDetailPage({ params }: PageProps) {
  const resolvedParams = await params;

  try {
    const session = await SessionService.getSession(resolvedParams.id);

    return <PublicSessionDetailClient session={session} />;
  } catch (error) {
    console.error('Error fetching session:', error);
    console.error('Session ID:', resolvedParams.id);
    notFound();
  }
}
