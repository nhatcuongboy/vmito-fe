import { Metadata } from 'next';
import DownloadClient from './DownloadClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Tải ứng dụng Vmito',
  en: 'Download Vmito',
  cn: '下载 Vmito',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Tải ứng dụng Vmito cho iOS và Android để tìm kèo, quản lý giải đấu và theo dõi điểm trình ngay trên điện thoại.',
  en: 'Download the Vmito app for iOS and Android to find sessions, manage tournaments, and track your rating on the go.',
  cn: '下载 Vmito 应用（支持 iOS 和 Android），随时查找约球、管理赛事、追踪积分。',
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
      canonical: `https://vmito.com/${locale}/download`,
      languages: {
        vi: 'https://vmito.com/vi/download',
        en: 'https://vmito.com/en/download',
        'zh-Hans': 'https://vmito.com/cn/download',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

// Generate static pages for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function DownloadPage() {
  return <DownloadClient />;
}
