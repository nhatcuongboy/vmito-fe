import JoinByCodeClient from './JoinByCodeClient';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }, { locale: 'cn' }];
}

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <JoinByCodeClient locale={locale} />;
}
