import ForgotPasswordClient from './ForgotPasswordClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <ForgotPasswordClient locale={locale} />;
}
