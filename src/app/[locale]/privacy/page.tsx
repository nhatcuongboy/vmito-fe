import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Chính sách bảo mật | Vmito',
  en: 'Privacy Policy | Vmito',
  cn: '隐私政策 | Vmito',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Chính sách bảo mật của Vmito - cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
  en: 'Vmito Privacy Policy - how we collect, use, and protect your personal information.',
  cn: 'Vmito 隐私政策 - 我们如何收集、使用和保护您的个人信息。',
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
      canonical: `https://vmito.com/${locale}/privacy`,
      languages: {
        vi: 'https://vmito.com/vi/privacy',
        en: 'https://vmito.com/en/privacy',
        'zh-Hans': 'https://vmito.com/cn/privacy',
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

export default async function PrivacyPage() {
  return <PrivacyClient />;
}
