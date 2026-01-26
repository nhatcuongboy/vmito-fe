import SignInClient from './SignInClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <SignInClient locale={locale} />;
}
