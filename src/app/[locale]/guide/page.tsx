import GuideClient from './GuideClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guide | Vmito',
  description:
    'Complete guide on how to use Vmito - badminton session management and tournament platform',
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function GuidePage() {
  return <GuideClient />;
}
