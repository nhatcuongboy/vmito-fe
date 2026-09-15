import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OsDownloadClient from './OsDownloadClient';
import { DOWNLOAD_OS_VALUES, isDownloadOs } from '../download-os';

interface PageProps {
  params: Promise<{ locale: string; os: string }>;
}

const osTitles: Record<'ios' | 'android', Record<string, string>> = {
  ios: { vi: 'Vmito cho iOS', en: 'Vmito for iOS', cn: 'iOS 版 Vmito' },
  android: {
    vi: 'Vmito cho Android',
    en: 'Vmito for Android',
    cn: 'Android 版 Vmito',
  },
};

const osDescriptions: Record<'ios' | 'android', Record<string, string>> = {
  ios: {
    vi: 'Tải Vmito trên App Store cho iPhone và iPad.',
    en: 'Download Vmito on the App Store for iPhone and iPad.',
    cn: '在 App Store 下载 Vmito，支持 iPhone 和 iPad。',
  },
  android: {
    vi: 'Tải file APK trực tiếp hoặc lấy Vmito trên Google Play.',
    en: 'Download the APK directly or get Vmito on Google Play.',
    cn: '直接下载 APK 或在 Google Play 获取 Vmito。',
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, os } = await params;
  if (!isDownloadOs(os)) return {};

  const title = osTitles[os][locale] ?? osTitles[os].vi;
  const description = osDescriptions[os][locale] ?? osDescriptions[os].vi;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}/download/${os}`,
      languages: {
        vi: `https://vmito.com/vi/download/${os}`,
        en: `https://vmito.com/en/download/${os}`,
        'zh-Hans': `https://vmito.com/cn/download/${os}`,
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

// Generate static pages for both platforms (crossed with the parent
// segment's locale params).
export async function generateStaticParams() {
  return DOWNLOAD_OS_VALUES.map((os) => ({ os }));
}

export default async function DownloadOsPage({ params }: PageProps) {
  const { os } = await params;
  if (!isDownloadOs(os)) notFound();

  return <OsDownloadClient os={os} />;
}
