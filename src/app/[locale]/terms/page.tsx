import { Metadata } from 'next';
import TermsClient from './TermsClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Điều khoản dịch vụ | Vmito',
  en: 'Terms of Service | Vmito',
  cn: '服务条款 | Vmito',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Điều khoản dịch vụ của Vmito - các quy tắc và điều kiện khi sử dụng nền tảng của chúng tôi.',
  en: 'Vmito Terms of Service - the rules and conditions for using our platform.',
  cn: 'Vmito 服务条款 - 使用我们平台的规则和条件。',
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
      canonical: `https://vmito.com/${locale}/terms`,
      languages: {
        vi: 'https://vmito.com/vi/terms',
        en: 'https://vmito.com/en/terms',
        'zh-Hans': 'https://vmito.com/cn/terms',
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

export default async function TermsPage() {
  return <TermsClient />;
}
