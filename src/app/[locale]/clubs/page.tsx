import { Metadata } from 'next';
import BrowseClubsContent from './BrowseClubsContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Câu lạc bộ cầu lông',
  en: 'Browse Badminton Clubs',
  cn: '浏览羽毛球俱乐部',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Khám phá và tham gia các câu lạc bộ cầu lông tại Việt Nam. Xem thông tin, thành viên và hoạt động của từng CLB trên Vmito.',
  en: 'Discover and join badminton clubs in Vietnam. View club details, members, and activities on Vmito.',
  cn: '探索并加入越南的羽毛球俱乐部。在 Vmito 上查看俱乐部详情、成员和活动。',
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
      canonical: `https://vmito.com/${locale}/clubs`,
      languages: {
        vi: 'https://vmito.com/vi/clubs',
        en: 'https://vmito.com/en/clubs',
        'zh-Hans': 'https://vmito.com/cn/clubs',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function BrowseClubsPage() {
  return <BrowseClubsContent />;
}
