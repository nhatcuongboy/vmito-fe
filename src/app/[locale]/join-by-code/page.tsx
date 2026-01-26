import JoinByCodeClient from './JoinByCodeClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <JoinByCodeClient locale={locale} />;
}
