'use client';

import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { ChevronRight, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { IClub } from '@/types/club';
import { useAuthStore } from '@/stores/useAuthStore';

interface UserClubsSectionProps {
  clubs: IClub[];
  userId: string;
}

function ClubRow({
  club,
  locale,
  membersLabel,
  keyPrefix,
  idx,
}: {
  club: IClub;
  locale: string;
  membersLabel: string;
  keyPrefix: string;
  idx: number;
}) {
  return (
    <Link
      key={`${keyPrefix}-${club.id}-${idx}`}
      href={`/${locale}/clubs/${club.id}`}
    >
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={3}
        bg="gray.50"
        _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
        _hover={{
          bg: 'gray.100',
          borderColor: 'green.300',
          _dark: { bg: 'gray.600', borderColor: 'green.500' },
        }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <HStack gap={3}>
          {club.image && (
            <Image
              src={club.image}
              alt={club.name}
              boxSize="40px"
              borderRadius="md"
              objectFit="cover"
            />
          )}
          <VStack align="start" gap={0} flex={1}>
            <Text
              fontWeight="semibold"
              color="gray.800"
              _dark={{ color: 'gray.100' }}
            >
              {club.name}
            </Text>
            {club.memberCount > 0 && (
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {club.memberCount} {membersLabel}
              </Text>
            )}
          </VStack>
          <ChevronRight size={16} color="gray" />
        </HStack>
      </Box>
    </Link>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="gray.300"
      borderRadius="lg"
      bg="gray.50"
      p={3}
      _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
    >
      <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
        {label}
      </Text>
    </Box>
  );
}

export default function UserClubsSection({
  clubs,
  userId,
}: UserClubsSectionProps) {
  const t = useTranslations('userProfilePage');
  const tClubs = useTranslations('clubs');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user: currentUser } = useAuthStore();

  const hostedClubs = clubs.filter((c) => (c.hostId ?? c.host?.id) === userId);
  const memberClubs = clubs.filter((c) => (c.hostId ?? c.host?.id) !== userId);
  const isOwnProfile = currentUser?.id === userId;

  // Own profile always shows the section so users can navigate to club
  // management even before creating or joining a club.
  const shouldShowSection = isOwnProfile ? true : hostedClubs.length > 0;
  if (!shouldShowSection) {
    return null;
  }

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      p={4}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <HStack justify="space-between" align="center" mb={3}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="gray.800"
          _dark={{ color: 'gray.100' }}
        >
          {t('clubs')}
        </Text>

        {isOwnProfile && (
          <Link href={`/${locale}/my-clubs`}>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              bg="green.50"
              color="green.700"
              borderColor="green.200"
              _hover={{ bg: 'green.100', borderColor: 'green.300' }}
            >
              <Settings size={14} />
              {tClubs('manageClubs')}
            </Button>
          </Link>
        )}
      </HStack>

      <VStack gap={4} align="stretch">
        {(isOwnProfile || hostedClubs.length > 0) && (
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="gray.600"
              _dark={{ color: 'gray.300' }}
              mb={2}
            >
              {t('hostedClubs')} ({hostedClubs.length})
            </Text>
            {hostedClubs.length === 0 ? (
              <EmptyBox label={t('noHostedClubs')} />
            ) : (
              <VStack gap={2} align="stretch">
                {hostedClubs.map((club, idx) => (
                  <ClubRow
                    key={`hosted-${club.id}-${idx}`}
                    club={club}
                    locale={locale}
                    membersLabel={tCommon('members')}
                    keyPrefix="hosted"
                    idx={idx}
                  />
                ))}
              </VStack>
            )}
          </Box>
        )}

        {isOwnProfile && (
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="gray.600"
              _dark={{ color: 'gray.300' }}
              mb={2}
            >
              {t('memberClubs')} ({memberClubs.length})
            </Text>
            {memberClubs.length === 0 ? (
              <EmptyBox label={t('noMemberClubs')} />
            ) : (
              <VStack gap={2} align="stretch">
                {memberClubs.map((club, idx) => (
                  <ClubRow
                    key={`member-${club.id}-${idx}`}
                    club={club}
                    locale={locale}
                    membersLabel={tCommon('members')}
                    keyPrefix="member"
                    idx={idx}
                  />
                ))}
              </VStack>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
}
