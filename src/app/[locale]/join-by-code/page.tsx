import JoinByCodeClient from './JoinByCodeClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';
import { Suspense } from 'react';

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function JoinByCodePage() {
  return (
    <Suspense>
      <JoinByCodeClient />
    </Suspense>
  );
}
