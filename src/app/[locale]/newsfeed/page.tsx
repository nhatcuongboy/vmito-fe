import { Metadata } from 'next';
import NewsfeedContent from './NewsfeedContent';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const localeTitles: Record<string, string> = {
  vi: 'Bảng tin cộng đồng cầu lông',
  en: 'Badminton Community Newsfeed',
  cn: '羽毛球社区动态',
};

const localeDescriptions: Record<string, string> = {
  vi: 'Cập nhật những bài viết và hoạt động mới nhất từ cộng đồng cầu lông trên Vmito.',
  en: 'Stay updated with the latest posts and activities from the badminton community on Vmito.',
  cn: '在 Vmito 上 及时了解羽毛球社区的最新帖子和活动。',
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
      canonical: `https://vmito.com/${locale}/newsfeed`,
      languages: {
        vi: 'https://vmito.com/vi/newsfeed',
        en: 'https://vmito.com/en/newsfeed',
        'zh-Hans': 'https://vmito.com/cn/newsfeed',
      },
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function NewsfeedPage() {
  return <NewsfeedContent />;
}
