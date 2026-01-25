import SignUpClient from './SignUpClient';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }, { locale: 'cn' }];
}

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <SignUpClient locale={locale} />;
}
