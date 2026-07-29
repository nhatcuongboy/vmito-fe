'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react';
import { CalendarDays, MapPin, Share2, UserRound, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import { Tournament, TournamentStatus } from '@/lib/api/types';

const AppLightbox = dynamic(() => import('@/components/ui/AppLightbox'));

interface TournamentHomeHeroProps {
  tournament: Tournament;
  status: TournamentStatus;
  coverImage: string;
  dateLabel: string;
  heroDateLabel: string;
  venueName: string;
  totalTeams: number;
  totalAthletes: number;
  isLoadingCounts: boolean;
  slug: string;
  showFavorite: boolean;
  onShare: () => void;
}

const STATUS_COLORS: Record<
  TournamentStatus,
  { bg: string; color: string; dot: string }
> = {
  [TournamentStatus.PREPARING]: {
    bg: 'rgba(255, 255, 255, 0.92)',
    color: 'gray.800',
    dot: 'blue.500',
  },
  [TournamentStatus.IN_PROGRESS]: {
    bg: 'rgba(220, 252, 231, 0.94)',
    color: 'green.800',
    dot: 'green.500',
  },
  [TournamentStatus.FINISHED]: {
    bg: 'rgba(254, 249, 195, 0.94)',
    color: 'yellow.800',
    dot: 'yellow.500',
  },
  [TournamentStatus.CANCELLED]: {
    bg: 'rgba(254, 226, 226, 0.94)',
    color: 'red.800',
    dot: 'red.500',
  },
};

export default function TournamentHomeHero({
  tournament,
  status,
  coverImage,
  dateLabel,
  heroDateLabel,
  venueName,
  totalTeams,
  totalAthletes,
  isLoadingCounts,
  slug,
  showFavorite,
  onShare,
}: TournamentHomeHeroProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const statusTone = STATUS_COLORS[status];
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  return (
    <Box>
      <Box
        display={{ base: 'block', md: 'none' }}
        position="relative"
        borderRadius="2xl"
        overflow="hidden"
        bg="gray.200"
        aspectRatio={2 / 1}
        boxShadow="0 18px 42px rgba(15, 23, 42, 0.14)"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={tournament.name}
            w="100%"
            h="100%"
            objectFit="cover"
            fetchPriority="high"
            cursor="zoom-in"
            onClick={() => setIsCoverOpen(true)}
          />
        ) : (
          <Box
            w="100%"
            h="100%"
            bg="linear-gradient(135deg, #16a34a 0%, #0f766e 100%)"
          />
        )}

        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, rgba(2, 6, 23, 0.02) 20%, rgba(2, 6, 23, 0.78) 100%)"
          pointerEvents="none"
        />

        <Badge
          position="absolute"
          top={3}
          left={3}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          px={2.5}
          py={1}
          borderRadius="full"
          bg={statusTone.bg}
          color={statusTone.color}
          boxShadow="0 4px 14px rgba(15, 23, 42, 0.12)"
        >
          <Box
            w="7px"
            h="7px"
            borderRadius="full"
            bg={statusTone.dot}
            className={
              status === TournamentStatus.IN_PROGRESS
                ? 'tournament-live-dot'
                : undefined
            }
          />
          {t(`status.${status}`)}
        </Badge>

        <Flex position="absolute" top={3} right={3} zIndex={1} gap={2}>
          <Box
            as="button"
            aria-label={t('hero.share')}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="34px"
            h="34px"
            borderRadius="full"
            color="white"
            bg="rgba(15, 23, 42, 0.42)"
            backdropFilter="blur(6px)"
            boxShadow="0 4px 14px rgba(15, 23, 42, 0.18)"
            transition="background 0.15s ease"
            _hover={{ bg: 'rgba(15, 23, 42, 0.62)' }}
          >
            <Share2 size={17} aria-hidden="true" />
          </Box>
          {showFavorite ? (
            <FavoriteEngagementControl
              type="TOURNAMENT"
              targetId={tournament.id}
              initialIsFavorite={tournament.isFavorite}
              returnUrl={`/tournament/${slug}`}
              variant="overlay-dark"
            />
          ) : null}
        </Flex>

        <Flex
          position="absolute"
          left={4}
          right={4}
          bottom={4}
          direction="column"
          gap={1.5}
          color="white"
        >
          <Flex align="center" gap={2}>
            <CalendarDays size={16} aria-hidden="true" />
            <Text
              fontSize="sm"
              fontWeight="semibold"
              textShadow="0 1px 4px #000"
            >
              {heroDateLabel}
            </Text>
          </Flex>
          {venueName ? (
            <Flex align="center" gap={2} minW={0}>
              <MapPin size={16} aria-hidden="true" />
              <Text
                fontSize="sm"
                fontWeight="medium"
                lineClamp={1}
                textShadow="0 1px 4px #000"
              >
                {venueName}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Box>

      <Flex
        mt={{ base: 3, md: 0 }}
        px={{ base: 3.5, md: 4 }}
        py={3}
        borderWidth="1px"
        borderColor="var(--tournament-accent-border)"
        borderRadius="xl"
        bg="rgba(255, 255, 255, 0.88)"
        boxShadow="var(--tournament-shadow-soft)"
        backdropFilter="blur(12px)"
        justify="space-between"
        gap={3}
        _dark={{
          bg: 'var(--tournament-surface-raised)',
          borderColor: 'var(--tournament-accent-border)',
        }}
      >
        <HeroStat
          icon={<Users size={18} aria-hidden="true" />}
          value={
            isLoadingCounts
              ? t('hero.loading')
              : t('hero.teams', { count: totalTeams })
          }
        />
        <Box w="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
        <HeroStat
          icon={<UserRound size={18} aria-hidden="true" />}
          value={
            isLoadingCounts
              ? t('hero.loading')
              : t('hero.athletes', { count: totalAthletes })
          }
        />
        <Box
          display={{ base: 'none', md: 'block' }}
          w="1px"
          bg="gray.200"
          _dark={{ bg: 'gray.700' }}
        />
        <Flex
          display={{ base: 'none', md: 'flex' }}
          align="center"
          gap={2}
          minW={0}
          flex={1}
        >
          <CalendarDays size={18} aria-hidden="true" />
          <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
            {dateLabel}
          </Text>
        </Flex>
        {venueName ? (
          <>
            <Box
              display={{ base: 'none', lg: 'block' }}
              w="1px"
              bg="gray.200"
              _dark={{ bg: 'gray.700' }}
            />
            <Flex
              display={{ base: 'none', lg: 'flex' }}
              align="center"
              gap={2}
              minW={0}
              flex={1}
            >
              <MapPin size={18} aria-hidden="true" />
              <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                {venueName}
              </Text>
            </Flex>
          </>
        ) : null}
      </Flex>

      {isCoverOpen && coverImage ? (
        <AppLightbox
          images={[coverImage]}
          alt={tournament.name}
          onClose={() => setIsCoverOpen(false)}
        />
      ) : null}
    </Box>
  );
}

function HeroStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Flex align="center" justify="center" gap={2} minW={0} flex={1}>
      <Box color="green.600" flexShrink={0} _dark={{ color: 'green.300' }}>
        {icon}
      </Box>
      <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
        {value}
      </Text>
    </Flex>
  );
}
