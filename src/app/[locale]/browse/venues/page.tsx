import { Metadata } from 'next';
import BrowseVenuesContent from './BrowseVenuesContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Tra cứu sân cầu lông',
  en: 'Browse Badminton Courts',
  cn: '浏览羽毛球场',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Tìm kiếm và khám phá các sân cầu lông tại Việt Nam. Xem thông tin, giờ mở cửa, giá thuê sân.',
  en: 'Find and explore badminton courts in Vietnam. View details, opening hours, and court rental prices.',
  cn: '在越南查找和探索羽毛球场。查看详情、开放时间和场地租用价格。',
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
      canonical: `https://vmito.com/${locale}/browse/venues`,
      languages: {
        vi: 'https://vmito.com/vi/browse/venues',
        en: 'https://vmito.com/en/browse/venues',
        'zh-Hans': 'https://vmito.com/cn/browse/venues',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function BrowseVenuesPage() {
  return <BrowseVenuesContent />;
}
