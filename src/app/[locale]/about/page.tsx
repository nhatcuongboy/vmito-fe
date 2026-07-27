import { Metadata } from 'next';
import AboutClient from './AboutClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Giới thiệu Vmito',
  en: 'About Vmito',
  cn: '关于 Vmito',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Vmito - nền tảng tìm kèo, giao lưu và quản lý giải đấu cầu lông hàng đầu tại Việt Nam. Tìm hiểu về sứ mệnh và tính năng của chúng tôi.',
  en: 'Vmito - the leading platform to find badminton sessions, connect with players, and manage tournaments in Vietnam. Learn about our mission and features.',
  cn: 'Vmito - 越南领先的羽毛球约球、交流和赛事管理平台。了解我们的使命和功能。',
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
      canonical: `https://vmito.com/${locale}/about`,
      languages: {
        vi: 'https://vmito.com/vi/about',
        en: 'https://vmito.com/en/about',
        'zh-Hans': 'https://vmito.com/cn/about',
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

export default async function AboutPage() {
  return <AboutClient />;
}
