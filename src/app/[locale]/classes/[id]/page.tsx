import { Metadata } from 'next';
import { cache } from 'react';
import { Box, HStack, Image, Stack, Text } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import { ClassesService } from '@/lib/api/classes.service';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { stripHtml } from '@/utils/string-utils';
import { IClass } from '@/types/class';
import FeatureFlagGuard from '@/components/guards/FeatureFlagGuard';
import ClassDetailActions from './ClassDetailActions';
import ClubSocialLinks from '@/app/[locale]/clubs/[id]/components/ClubSocialLinks';

const BASE_URL = 'https://vmito.com';
const getClass = cache(async (id: string): Promise<IClass | null> => {
  try {
    return await ClassesService.get(id);
  } catch {
    return null;
  }
});
const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

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
    <FeatureFlagGuard flag="CLASSES_FEATURE_ENABLED">
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
        <PageLayout>
          <Stack gap="6" maxW="960px" mx="auto">
            <Image
              src={item.coverPhoto || item.images?.[0] || DEFAULT_COVER_PHOTO}
              alt={item.name}
              w="full"
              maxH="420px"
              objectFit="cover"
              borderRadius="xl"
            />
            <Box>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="3xl" fontWeight="bold">
                    {item.name}
                  </Text>
                  <Text color="fg.muted">
                    {item.sportType === 'PICKLEBALL'
                      ? 'Pickleball'
                      : 'Cầu lông'}{' '}
                    · {location}
                  </Text>
                </Box>
                {item.status === 'CLOSED' && (
                  <Text color="red.500" fontWeight="bold">
                    Đã đóng tuyển sinh
                  </Text>
                )}
              </HStack>
            </Box>
            <ClassDetailActions item={item} />
            <ClubSocialLinks socialLinks={item.socialLinks || undefined} />
            <Box>
              <Text fontWeight="bold" mb="2">
                Lịch học
              </Text>
              {item.schedules.map((schedule) => (
                <Text
                  key={
                    schedule.id || `${schedule.dayOfWeek}-${schedule.startTime}`
                  }
                >
                  {days[schedule.dayOfWeek]}: {schedule.startTime} –{' '}
                  {schedule.endTime}
                </Text>
              ))}
            </Box>
            <Box>
              <Text fontWeight="bold" mb="2">
                Giới thiệu lớp
              </Text>
              <Text whiteSpace="pre-wrap">
                {stripHtml(item.description || 'Chưa có mô tả.')}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Học phí</Text>
              <Text>
                {item.tuitionPeriod === 'CONTACT'
                  ? 'Liên hệ để biết học phí'
                  : `${(item.tuitionAmount || 0).toLocaleString('vi-VN')}đ`}
                {item.tuitionNotes ? ` · ${item.tuitionNotes}` : ''}
              </Text>
            </Box>
          </Stack>
        </PageLayout>
      </>
    </FeatureFlagGuard>
  );
}
