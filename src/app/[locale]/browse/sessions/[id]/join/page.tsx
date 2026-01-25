import JoinSessionClient from './JoinSessionClient';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function JoinSessionPage({ params }: PageProps) {
  const { id } = await params;
  
  return <JoinSessionClient id={id} />;
}
