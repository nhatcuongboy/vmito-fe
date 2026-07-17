'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  HStack,
  Spinner,
  Image,
  Grid,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import { useParams, useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EMemberRole, EJoinRequestStatus } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import { DEFAULT_COVER_PHOTO, ROUTES } from '@/constants';
import {
  DEFAULT_CLUB_TAB,
  isClubDetailTab,
  TClubDetailTab,
} from './club-detail.types';
import { ClubDetailHero } from './components/ClubDetailHero';
import { ClubDetailTabList } from './components/ClubDetailTabList';
import { ClubAboutTab } from './components/ClubAboutTab';
import { ClubScheduleTab } from './components/ClubScheduleTab';
import { ClubAnnouncementsTab } from './components/ClubAnnouncementsTab';
import { ClubPhotosTab } from './components/ClubPhotosTab';
import { ClubMembersTab } from './components/ClubMembersTab';
import { ClubDetailSidebar } from './components/ClubDetailSidebar';

interface ClubDetailClientProps {
  initialClub: IClub | null;
}

export default function ClubDetailClient({
  initialClub,
}: ClubDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TClubDetailTab>(
    isClubDetailTab(tabParam) ? tabParam : DEFAULT_CLUB_TAB
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      const nextTab = isClubDetailTab(tab) ? tab : DEFAULT_CLUB_TAB;
      setActiveTab(nextTab);

      const query = new URLSearchParams(searchParams.toString());
      if (nextTab === DEFAULT_CLUB_TAB) {
        query.delete('tab');
      } else {
        query.set('tab', nextTab);
      }
      const queryString = query.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const loadClubDetails = useCallback(
    async (silent?: boolean) => {
      try {
        if (!silent) setIsLoading(true);
        const [data, myRequests] = await Promise.all([
          ClubsService.getClubDetails(clubId),
          ClubsService.getMyJoinRequests().catch(() => []),
        ]);
        setClub(data);
        const pending = myRequests.some(
          (r) => r.clubId === clubId && r.status === EJoinRequestStatus.PENDING
        );
        setHasPendingRequest(pending);
      } catch (error) {
        console.error('Failed to load club details:', error);
        toaster.error({ title: t('common.error') });
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [clubId, t]
  );

  useEffect(() => {
    if (initialClub) return;

    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails, initialClub]);

  const isUserMember = club?.members?.some(
    (m) => m.user.id === currentUser?.id
  );

  const isUserAdmin =
    !!currentUser &&
    (currentUser.role === UserRole.ADMIN ||
      (club?.hostId && String(club.hostId) === String(currentUser.id)) ||
      (club?.host?.id && String(club.host.id) === String(currentUser.id)) ||
      club?.members?.some(
        (m) =>
          (String(m.userId) === String(currentUser.id) ||
            String(m?.user?.id) === String(currentUser.id)) &&
          m.role === EMemberRole.ADMIN
      ));

  const handleJoinClub = async () => {
    if (!currentUser) {
      router.push(ROUTES.AUTH.SIGNIN);
      return;
    }
    if (!club) return;

    try {
      setIsJoining(true);
      const result = await ClubsService.requestToJoin(club.id);
      toaster.success({
        title:
          result.status === 'joined'
            ? t('clubs.joinedSuccessfully')
            : t('clubs.joinRequestSent'),
      });
      if (result.status === 'pending') {
        setHasPendingRequest(true);
      }
      await loadClubDetails();
    } catch (error) {
      console.error('Failed to join club:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title={t('clubs.clubDetails')}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  if (!club) {
    return (
      <PageLayout title={t('common.error')}>
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>{t('common.error')}</Heading>
          <Button
            colorPalette="green"
            onClick={() => router.push(ROUTES.CLUBS.BROWSE)}
          >
            {t('common.back')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const clubDisplayImage = club.image || DEFAULT_COVER_PHOTO;

  return (
    <PageLayout
      title={
        <HStack gap={2} align="center">
          <Box
            w="32px"
            h="32px"
            display={{ base: 'flex', md: 'none' }}
            borderRadius="md"
            overflow="hidden"
            bg="gray.100"
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
          >
            <Image
              src={clubDisplayImage}
              alt={club.name}
              objectFit="cover"
              w="full"
              h="full"
            />
          </Box>
          <Text truncate fontWeight="bold">
            {club.name}
          </Text>
        </HStack>
      }
    >
      <ClubDetailHero club={club} clubDisplayImage={clubDisplayImage} />

      {/* Navigation Tabs & Content */}
      <Container maxW="container.xl" pb={8} px={0}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => handleTabChange(e.value)}
          variant="plain"
        >
          <ClubDetailTabList
            announcementCount={club.announcements?.length ?? 0}
          />

          {/* Grid Layout 7:3 */}
          <Grid
            templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }}
            gap={6}
            mt={0}
          >
            {/* Main Content - Left Column */}
            <Box>
              <ClubAboutTab description={club.description} />

              <ClubMembersTab
                club={club}
                isUserAdmin={Boolean(isUserAdmin)}
                onClubChanged={loadClubDetails}
              />

              <ClubScheduleTab schedules={club.schedules} />

              <ClubAnnouncementsTab announcements={club.announcements} />
              <ClubPhotosTab clubName={club.name} images={club.images} />
            </Box>

            <ClubDetailSidebar
              club={club}
              isUserAdmin={Boolean(isUserAdmin)}
              isUserMember={Boolean(isUserMember)}
              hasPendingRequest={hasPendingRequest}
              isJoining={isJoining}
              onJoin={handleJoinClub}
              onTabChange={handleTabChange}
            />
          </Grid>
        </Tabs.Root>
      </Container>
    </PageLayout>
  );
}
