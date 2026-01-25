import AboutClient from './AboutClient';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }, { locale: 'cn' }];
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AboutClient locale={locale} />;
}
