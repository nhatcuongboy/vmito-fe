import { Metadata } from 'next';
import {
  defaultOpenGraphImage,
  defaultSeoDescription,
} from '@/lib/seo/metadata';
import HomePageContent from './HomePageContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeDescriptions: Record<string, string> = {
  vi: 'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam. Dạy sớm healthy, cầu lông dưỡng sinh, giao lưu cuối tuần.',
  en: 'Find badminton sessions, join games, and manage tournaments in Vietnam. Browse courts and connect with players near you.',
  cn: '在越南寻找羽毛球场次、加入比赛和管理锦标赛。浏览球场并与附近球员联系。',
};

const localeTitles: Record<string, string> = {
  vi: 'Tìm kèo cầu lông',
  en: 'Find Badminton Sessions',
  cn: '寻找羽毛球场次',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const title = localeTitles[locale] ?? localeTitles.vi;
  const description =
    localeDescriptions[locale] ??
    localeDescriptions.vi ??
    defaultSeoDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `https://vmito.com/${locale}`,
      languages: {
        vi: 'https://vmito.com/vi',
        en: 'https://vmito.com/en',
        'zh-Hans': 'https://vmito.com/cn',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Vmito',
      url: `/${locale}`,
      title,
      description,
      images: [defaultOpenGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultOpenGraphImage.url],
    },
  };
}

export default function HomePage() {
  return <HomePageContent />;
}
