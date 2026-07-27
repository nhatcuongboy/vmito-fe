import GuideClient from './GuideClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Hướng dẫn sử dụng Vmito',
  en: 'Vmito User Guide',
  cn: 'Vmito 使用指南',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Hướng dẫn chi tiết cách sử dụng Vmito - nền tảng quản lý kèo và giải đấu cầu lông.',
  en: 'Complete guide on how to use Vmito - the badminton session management and tournament platform.',
  cn: '关于如何使用 Vmito 的完整指南 - 羽毛球约球和赛事管理平台。',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const title = localeTitles[locale] ?? localeTitles.vi;
  const description = localeDescriptions[locale] ?? localeDescriptions.vi;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}/guide`,
      languages: {
        vi: 'https://vmito.com/vi/guide',
        en: 'https://vmito.com/en/guide',
        'zh-Hans': 'https://vmito.com/cn/guide',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function GuidePage() {
  return <GuideClient />;
}
