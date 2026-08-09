import { Metadata } from 'next';
import { cache } from 'react';
import { Text } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import { ClassesService } from '@/lib/api/classes.service';
import { CLASSES_FEATURE_ENABLED, DEFAULT_COVER_PHOTO } from '@/constants';
import { stripHtml } from '@/utils/string-utils';
import { IClass } from '@/types/class';
import FeatureFlagGuard from '@/components/guards/FeatureFlagGuard';
import ClassDetailClient from './ClassDetailClient';

const BASE_URL = 'https://vmito.com';
const getClass = cache(async (id: string): Promise<IClass | null> => {
  try {
    return await ClassesService.get(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  if (locale !== 'vi') return { robots: { index: false, follow: true } };
  const item = await getClass(id);
  if (!item)
    return {
      title: 'Lớp học thể thao',
      robots: { index: false, follow: true },
    };
  const description = stripHtml(item.description || `Lớp ${item.name}`)
    .replace(/\s+/g, ' ')
    .slice(0, 160);
  const canonical = `${BASE_URL}/vi/classes/${item.slug}`;
  return {
    title: `${item.name} | Vmito`,
    description,
    alternates: { canonical },
    openGraph: {
      title: item.name,
      description,
      url: canonical,
      images: [{ url: item.coverPhoto || DEFAULT_COVER_PHOTO, alt: item.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.name,
      description,
      images: [item.coverPhoto || DEFAULT_COVER_PHOTO],
    },
  };
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const item = await getClass(id);
  if (!item)
    return (
      <PageLayout>
        <Text>Không tìm thấy lớp học.</Text>
      </PageLayout>
    );
  const location = item.venue
    ? `${item.venue.name}${item.venue.address ? ` - ${item.venue.address}` : ''}`
    : [item.customLocationName, item.customLocationAddress]
        .filter(Boolean)
        .join(' - ');
  const canonical = `${BASE_URL}/vi/classes/${item.slug}`;
  const jsonLd =
    locale === 'vi'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: item.name,
          description: stripHtml(item.description || item.name),
          url: canonical,
          provider: { '@type': 'Person', name: item.contactName },
          image: item.coverPhoto ? [item.coverPhoto] : undefined,
          offers:
            item.tuitionPeriod === 'CONTACT'
              ? undefined
              : {
                  '@type': 'Offer',
                  price: item.tuitionAmount,
                  priceCurrency: 'VND',
                  availability:
                    item.status === 'CLOSED'
                      ? 'https://schema.org/SoldOut'
                      : 'https://schema.org/InStock',
                },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'offline',
            startDate: item.startDate || undefined,
            endDate: item.endDate || undefined,
            location: { '@type': 'Place', name: location || undefined },
          },
        }
      : null;
  const breadcrumb =
    locale === 'vi'
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Tìm lớp học',
              item: `${BASE_URL}/vi/classes`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: item.name,
              item: canonical,
            },
          ],
        }
      : null;
  return (
    <FeatureFlagGuard enabled={CLASSES_FEATURE_ENABLED}>
      <>
        <>
          {jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}
          {breadcrumb && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
            />
          )}
        </>
        <ClassDetailClient item={item} />
      </>
    </FeatureFlagGuard>
  );
}
