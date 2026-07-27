import { Metadata } from 'next';
import { Suspense, cache } from 'react';
import { UserService, IPublicProfileMeta } from '@/lib/api/user.service';
import PublicUserProfileContent from '@/components/player/PublicUserProfileContent';

const BASE_URL = 'https://vmito.com';

interface PageProps {
  params: Promise<{ userId: string; locale: string }>;
}

const getProfile = cache(
  async (userId: string): Promise<IPublicProfileMeta | null> => {
    try {
      return await UserService.getPublicProfile(userId);
    } catch {
      return null;
    }
  }
);

const buildDescription = (
  profile: IPublicProfileMeta,
  locale: string
): string => {
  const level = profile.levelDescription
    ? profile.levelDescription
    : profile.level
      ? String(profile.level)
      : undefined;

  if (locale === 'en') {
    return `Public badminton profile of ${profile.name}${
      level ? ` - Level ${level}` : ''
    }. View stats, match history, and ratings on Vmito.`;
  }
  if (locale === 'cn') {
    return `${profile.name} 的羽毛球公开资料${
      level ? ` - 等级 ${level}` : ''
    }。在 Vmito 上查看数据、比赛记录和评分。`;
  }
  return `Hồ sơ cầu lông của ${profile.name}${
    level ? ` - Trình độ ${level}` : ''
  }. Xem thống kê, lịch sử thi đấu và đánh giá trên Vmito.`;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  const profile = await getProfile(userId);

  if (!profile) {
    return {
      title: 'Hồ sơ người chơi cầu lông | Vmito',
      description:
        'Xem hồ sơ, thống kê và lịch sử thi đấu của người chơi cầu lông trên Vmito.',
      openGraph: { images: ['/og-image.png'] },
    };
  }

  const title = `${profile.name} | Vmito`;
  const description = buildDescription(profile, locale);
  const images = profile.image ? [profile.image] : ['/og-image.png'];
  const canonicalUrl = `${BASE_URL}/${locale || 'vi'}/user/${userId}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: `${BASE_URL}/vi/user/${userId}`,
        en: `${BASE_URL}/en/user/${userId}`,
        'zh-Hans': `${BASE_URL}/cn/user/${userId}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function PublicUserProfilePage({ params }: PageProps) {
  const { userId, locale } = await params;
  const profile = await getProfile(userId);

  const jsonLd = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: profile.name,
          url: `${BASE_URL}/${locale || 'vi'}/user/${userId}`,
          ...(profile.image ? { image: profile.image } : {}),
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense>
        <PublicUserProfileContent userId={userId} />
      </Suspense>
    </>
  );
}
