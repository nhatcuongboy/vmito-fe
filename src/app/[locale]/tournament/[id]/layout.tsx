import { ExtendIntlMessages } from '@/components/ExtendIntlMessages';
import TournamentRouteBoundary from '@/components/tournament/TournamentRouteBoundary';
import { loadMessages, pickNamespace } from '@/i18n/scopedMessages';

export default async function TournamentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = pickNamespace(
    await loadMessages(locale),
    'pages.tournaments'
  );

  return (
    <ExtendIntlMessages messages={messages}>
      <TournamentRouteBoundary>{children}</TournamentRouteBoundary>
    </ExtendIntlMessages>
  );
}
