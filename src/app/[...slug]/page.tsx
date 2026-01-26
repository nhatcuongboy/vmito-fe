import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const supportedLocales = SUPPORTED_LOCALES as readonly string[];
  const defaultLocale = Locale.VI;

  if (!resolvedParams.slug || resolvedParams.slug.length === 0) {
    redirect(`/${defaultLocale}`);
  }

  const firstSegment = resolvedParams.slug[0];

  // If first segment is not a valid locale, redirect to add default locale
  if (!supportedLocales.includes(firstSegment)) {
    const newPath = `/${defaultLocale}/${resolvedParams.slug.join('/')}`;
    redirect(newPath);
  }

  // If it's a valid locale but the path doesn't exist, show 404
  notFound();
}
