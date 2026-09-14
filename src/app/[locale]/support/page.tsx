import type { Metadata } from 'next';
import { SUPPORTED_LOCALES } from '@/i18n/locales';
import SupportClient from './SupportClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeMetadata: Record<string, { title: string; description: string }> = {
  vi: {
    title: 'Trung tâm hỗ trợ Vmito',
    description:
      'Tìm câu trả lời nhanh, xem hướng dẫn và liên hệ đội ngũ hỗ trợ Vmito.',
  },
  en: {
    title: 'Vmito Support Center',
    description:
      'Find quick answers, browse guides, and contact the Vmito support team.',
  },
  cn: {
    title: 'Vmito 帮助中心',
    description: '快速查找答案、浏览指南并联系 Vmito 支持团队。',
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const metadata = localeMetadata[locale] ?? localeMetadata.vi;

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `https://vmito.com/${locale}/support`,
      languages: {
        vi: 'https://vmito.com/vi/support',
        en: 'https://vmito.com/en/support',
        'zh-Hans': 'https://vmito.com/cn/support',
      },
    },
    openGraph: metadata,
    twitter: metadata,
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function SupportPage() {
  return <SupportClient />;
}
