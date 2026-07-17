import { ExtendIntlMessages } from '@/components/ExtendIntlMessages';
import { loadMessages, pickNamespace } from '@/i18n/scopedMessages';

export default async function AboutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = pickNamespace(await loadMessages(locale), 'pages.about');

  return (
    <ExtendIntlMessages messages={messages}>{children}</ExtendIntlMessages>
  );
}
