import { Metadata } from 'next';
import BrowseVenuesContent from './BrowseVenuesContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Tìm sân cầu lông',
  en: 'Find Badminton Courts',
  cn: '查找羽毛球场',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Tìm kiếm các sân cầu lông. Xem thông tin, giờ mở cửa, giá thuê sân.',
  en: 'Find badminton courts. View details, opening hours, and court rental prices.',
  cn: '查找羽毛球场。查看详情、开放时间和场地租用价格。',
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
      canonical: `https://vmito.com/${locale}/venues`,
      languages: {
        vi: 'https://vmito.com/vi/venues',
        en: 'https://vmito.com/en/venues',
        'zh-Hans': 'https://vmito.com/cn/venues',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function BrowseVenuesPage() {
  return <BrowseVenuesContent />;
}
