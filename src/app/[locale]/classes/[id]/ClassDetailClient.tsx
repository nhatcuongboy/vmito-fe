'use client';

import { useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Link as ChakraLink,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Calendar,
  CalendarDays,
  ExternalLink,
  MapPin,
  Phone,
  Share2,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { DEFAULT_COVER_PHOTO, DETAIL_PAGE_MAX_W } from '@/constants';
import type { IClass } from '@/types/class';
import AppLightbox from '@/components/ui/AppLightbox';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import LevelBadgeWithDescription from '@/components/session/LevelBadgeWithDescription';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { sortLevelsByRank } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { ClubSocialLinks } from '@/app/[locale]/clubs/[id]/components/ClubSocialLinks';

type ClassTab = 'about' | 'schedule' | 'details' | 'photos';
const VALID_TABS: ClassTab[] = ['about', 'schedule', 'details', 'photos'];
const isTab = (value: string | null): value is ClassTab =>
  !!value && VALID_TABS.includes(value as ClassTab);

export default function ClassDetailClient({ item }: { item: IClass }) {
  const t = useTranslations('classes');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { getLevelShortLabel } = useLevelLabel();
  const [lightbox, setLightbox] = useState(false);
  const tab = isTab(params.get('tab')) ? params.get('tab') : 'about';
  const images = Array.from(
    new Set(
      [item.coverPhoto, ...(item.images || [])].filter(Boolean) as string[]
    )
  );
  const locationName = item.venue?.name || item.customLocationName;
  const address = item.venue?.address || item.customLocationAddress;
  const mapsQuery = [locationName, address].filter(Boolean).join(', ');
  const mapsUrl = mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
    : undefined;
  const tuition =
    item.tuitionPeriod === 'CONTACT'
      ? t('contactTuition')
      : new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(item.tuitionAmount || 0);
  const setTab = (next: string) => {
    const value = isTab(next) ? next : 'about';
    const query = new URLSearchParams(params.toString());
    if (value === 'about') {
      query.delete('tab');
    } else {
      query.set('tab', value);
    }
    router.replace(`${pathname}${query.size ? `?${query}` : ''}`, {
      scroll: false,
    });
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: item.name, url });
    else await navigator.clipboard.writeText(url);
  };
  return (
    <PageLayout title={item.name} maxW={DETAIL_PAGE_MAX_W}>
      <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
        <Box
          position="relative"
          w={{ base: 'calc(100% + 48px)', md: 'full' }}
          mx={{ base: '-24px', md: 0 }}
          h={{ base: '220px', md: '300px' }}
          overflow="hidden"
          borderRadius={{ base: 0, md: '2xl' }}
          mb={4}
        >
          <Image
            src={images[0] || DEFAULT_COVER_PHOTO}
            alt={item.name}
            w="full"
            h="full"
            objectFit="cover"
            cursor="pointer"
            onClick={() => setLightbox(true)}
          />
          <Box
            position="absolute"
            inset={0}
            bgGradient="to-t"
            gradientFrom="blackAlpha.600"
            gradientTo="transparent"
            pointerEvents="none"
          />
          <HStack position="absolute" top={3} right={3}>
            <FavoriteEngagementControl
              type="CLASS"
              targetId={item.id}
              initialIsFavorite={item.isFavorite}
              returnUrl={`/classes/${item.slug}`}
              variant="overlay-dark"
            />
            <IconButton
              aria-label={t('share')}
              icon={<Share2 size={18} />}
              onClick={() => void share()}
              color="white"
              bg="blackAlpha.500"
              borderRadius="full"
            />
          </HStack>
        </Box>
        <Box
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="sm"
          borderRadius="2xl"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3.5 }}
          mb={4}
        >
          <Flex gap={{ base: 3, md: 4 }} align="center">
            <Box
              w="48px"
              h="48px"
              borderRadius="lg"
              bg="green.50"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontWeight="bold" color="green.600" fontSize="xl">
                {item.name[0]}
              </Text>
            </Box>
            <Box flex="1" minW={0}>
              <HStack wrap="wrap">
                <Heading size={{ base: 'lg', md: 'xl' }} lineClamp={2}>
                  {item.name}
                </Heading>
                {item.status === 'CLOSED' && (
                  <Badge colorPalette="red">{t('closed')}</Badge>
                )}
              </HStack>
              <Text color="fg.muted" mt={1}>
                {item.sportType === 'PICKLEBALL'
                  ? t('pickleball')
                  : t('badminton')}
                {locationName ? ` · ${locationName}` : ''}
              </Text>
            </Box>
          </Flex>
        </Box>
        <Tabs.Root
          value={tab}
          onValueChange={(e) => setTab(e.value)}
          variant="plain"
        >
          <Tabs.List
            display="flex"
            w="full"
            bg="white"
            _dark={{ bg: 'gray.800', borderColor: 'gray.800' }}
            borderWidth="1px"
            borderColor="gray.100"
            boxShadow="sm"
            borderRadius="2xl"
            p={1.5}
            gap={1}
            overflowX="auto"
            mb={6}
          >
            <Tab
              value="about"
              icon={<CalendarDays size={16} />}
              label={t('aboutTab')}
            />
            <Tab
              value="schedule"
              icon={<Calendar size={16} />}
              label={t('scheduleTab')}
            />
            <Tab
              value="details"
              icon={<Users size={16} />}
              label={t('detailsTab')}
            />
            {images.length > 1 && (
              <Tab
                value="photos"
                icon={<CalendarDays size={16} />}
                label={t('photosTab')}
              />
            )}
          </Tabs.List>
          <Grid templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }} gap={6}>
            <Box>
              <Tabs.Content value="about">
                <Panel title={t('aboutTab')}>
                  {item.description ? (
                    <RichTextDisplay content={item.description} />
                  ) : (
                    <Text color="fg.muted">{t('noDescription')}</Text>
                  )}
                </Panel>
              </Tabs.Content>
              <Tabs.Content value="schedule">
                <Panel title={t('scheduleTab')}>
                  <VStack align="stretch" gap={3}>
                    {item.schedules.length ? (
                      [...item.schedules]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((s) => (
                          <Flex
                            key={s.id || `${s.dayOfWeek}-${s.startTime}`}
                            p={4}
                            bg="gray.50"
                            _dark={{ bg: 'gray.900' }}
                            borderRadius="xl"
                            gap={4}
                            align="center"
                          >
                            <Calendar color="var(--chakra-colors-blue-500)" />
                            <Box>
                              <Text fontWeight="bold">
                                {t(`dayNames.${s.dayOfWeek}`)}
                              </Text>
                              <Text color="fg.muted">
                                {s.startTime} – {s.endTime}
                              </Text>
                            </Box>
                          </Flex>
                        ))
                    ) : (
                      <Text color="fg.muted">{t('noSchedule')}</Text>
                    )}
                  </VStack>
                </Panel>
              </Tabs.Content>
              <Tabs.Content value="details">
                <Panel title={t('detailsTab')}>
                  <VStack align="stretch" gap={4}>
                    <Info
                      label={t('tuition')}
                      value={`${tuition}${item.tuitionNotes ? ` · ${item.tuitionNotes}` : ''}`}
                    />
                    <Info
                      label={t('capacity')}
                      value={
                        item.capacity
                          ? String(item.capacity)
                          : t('notSpecified')
                      }
                    />
                    {item.startDate && (
                      <Info
                        label={t('startDate')}
                        value={new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                        }).format(new Date(item.startDate))}
                      />
                    )}
                    {item.endDate && (
                      <Info
                        label={t('endDate')}
                        value={new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                        }).format(new Date(item.endDate))}
                      />
                    )}
                  </VStack>
                </Panel>
              </Tabs.Content>
              <Tabs.Content value="photos">
                {images.length > 1 && (
                  <Panel title={t('photosTab')}>
                    <Grid
                      templateColumns={{
                        base: '1fr 1fr',
                        md: 'repeat(3, 1fr)',
                      }}
                      gap={3}
                    >
                      {images.map((src) => (
                        <Image
                          key={src}
                          src={src}
                          alt={item.name}
                          h="160px"
                          w="full"
                          objectFit="cover"
                          borderRadius="xl"
                          cursor="pointer"
                          onClick={() => setLightbox(true)}
                        />
                      ))}
                    </Grid>
                  </Panel>
                )}
              </Tabs.Content>
            </Box>
            <VStack
              align="stretch"
              gap={4}
              position={{ lg: 'sticky' }}
              top="80px"
              h="fit-content"
            >
              <Panel title={t('contact')}>
                <VStack align="stretch">
                  <ChakraLink
                    href={
                      item.status === 'CLOSED'
                        ? undefined
                        : `tel:${item.contactPhone}`
                    }
                  >
                    <Button
                      w="full"
                      colorPalette="green"
                      disabled={item.status === 'CLOSED'}
                    >
                      <Phone size={17} />
                      {t('callContact', { name: item.contactName })}
                    </Button>
                  </ChakraLink>
                  {item.zaloUrl && item.status !== 'CLOSED' && (
                    <ChakraLink href={item.zaloUrl} target="_blank">
                      <Button w="full" variant="outline">
                        {t('contactZalo')}
                      </Button>
                    </ChakraLink>
                  )}
                </VStack>
              </Panel>
              <Panel title={t('quickInfo')}>
                <VStack align="stretch" gap={4}>
                  {item.requiredLevels.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="fg.muted" mb={2}>
                        {t('level')}
                      </Text>
                      <Flex wrap="wrap" gap={1}>
                        {sortLevelsByRank(item.requiredLevels).map((level) => (
                          <LevelBadgeWithDescription
                            key={level}
                            level={level}
                            colorPalette={
                              getSkillLevelColor([level]).colorPalette
                            }
                          >
                            {getLevelShortLabel(level)}
                          </LevelBadgeWithDescription>
                        ))}
                      </Flex>
                    </Box>
                  )}
                  {locationName && (
                    <Box>
                      <Text fontSize="xs" color="fg.muted" mb={1}>
                        {t('location')}
                      </Text>
                      {mapsUrl ? (
                        <ChakraLink href={mapsUrl} target="_blank">
                          <HStack>
                            <MapPin size={16} />
                            <Text fontWeight="semibold">{locationName}</Text>
                            <ExternalLink size={13} />
                          </HStack>
                        </ChakraLink>
                      ) : (
                        <Text>{locationName}</Text>
                      )}
                      {address && (
                        <Text fontSize="sm" color="fg.muted">
                          {address}
                        </Text>
                      )}
                    </Box>
                  )}
                  <Box>
                    <Text fontSize="xs" color="fg.muted">
                      {t('tuition')}
                    </Text>
                    <Text fontWeight="bold">{tuition}</Text>
                  </Box>
                </VStack>
              </Panel>
              <Panel title={t('instructor')}>
                <HStack>
                  <Avatar.Root>
                    <Avatar.Image src={item.host.image || undefined} />
                    <Avatar.Fallback>{item.host.name[0]}</Avatar.Fallback>
                  </Avatar.Root>
                  <Text fontWeight="semibold">{item.host.name}</Text>
                </HStack>
              </Panel>
              {item.socialLinks && (
                <Panel title={t('socialLinks')}>
                  <ClubSocialLinks
                    socialLinks={item.socialLinks}
                    variant="compact"
                  />
                </Panel>
              )}
            </VStack>
          </Grid>
        </Tabs.Root>
        {lightbox && (
          <AppLightbox
            images={images}
            alt={item.name}
            onClose={() => setLightbox(false)}
          />
        )}
      </Container>
    </PageLayout>
  );
}
function Tab({
  value,
  icon,
  label,
}: {
  value: ClassTab;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tabs.Trigger
      value={value}
      gap={2}
      px={5}
      py={2}
      borderRadius="xl"
      flexShrink={0}
      _selected={{ bg: 'green.100', color: 'green.700' }}
    >
      {icon}
      <Text fontWeight="semibold" fontSize="sm">
        {label}
      </Text>
    </Tabs.Trigger>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      shadow="sm"
    >
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </Box>
  );
}
