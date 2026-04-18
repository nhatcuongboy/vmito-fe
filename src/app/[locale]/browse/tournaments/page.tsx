import { Metadata } from 'next';
import BrowseTournamentsContent from './BrowseTournamentsContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Tra cứu giải đấu cầu lông',
  en: 'Browse Badminton Tournaments',
  cn: '浏览羽毛球锦标赛',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Khám phá và đăng ký tham gia các giải đấu cầu lông tại Việt Nam. Xem lịch thi đấu, kết quả và bảng xếp hạng.',
  en: 'Explore and register for badminton tournaments in Vietnam. View schedules, results, and standings.',
  cn: '探索并报名参加越南的羽毛球锦标赛。查看赛程、结果和排名。',
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
      canonical: `https://vmito.com/${locale}/browse/tournaments`,
      languages: {
        vi: 'https://vmito.com/vi/browse/tournaments',
        en: 'https://vmito.com/en/browse/tournaments',
        'zh-Hans': 'https://vmito.com/cn/browse/tournaments',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function TournamentsPage() {
  return <BrowseTournamentsContent />;
}
