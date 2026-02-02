'use client';

import {
  Box,
  Flex,
  Icon,
  Text,
  Stack,
} from '@chakra-ui/react';
import {
  Eye,
  MapPin,
  Navigation,
} from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { IconButton } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { ISession } from '@/lib/api/types';
import BaseSessionCard from '../session/BaseSessionCard';

interface PlayerSessionCardProps {
  session: ISession;
}

export default function PlayerSessionCard({ session }: PlayerSessionCardProps) {
  const t = useTranslations('session');

  // Location row for PlayerSessionCard
  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon as={MapPin} boxSize={5} mr={2} color="blue.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Flex align="center" gap={1}>
            <Text fontWeight="medium" lineClamp={1}>
              {session.venue?.name || session.location}
            </Text>
            <IconButton
              size="xs"
              colorPalette="blue"
              variant="ghost"
              aria-label="Google Maps"
              onClick={(e) => {
                e.stopPropagation();
                const address =
                  session.venue?.address || session.venue?.name || session.location;
                if (address) {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                    '_blank'
                  );
                }
              }}
              icon={<Icon as={Navigation} />}
            />
          </Flex>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  const playerStats = (
    <Box mt={2} p={3} bg="blue.50" borderRadius="md" _dark={{ bg: 'blue.900/40' }}>
      <Text
        fontSize="sm"
        fontWeight="medium"
        color="blue.700"
        _dark={{ color: 'blue.200' }}
      >
        {t('yourStats')}:
      </Text>
      <Flex gap={4} mt={1}>
        <Text fontSize="sm">{/* {t("matches")}: {session.playerData.matchesPlayed} */}</Text>
        <Text fontSize="sm">
          {t('waitTime')}: {/* {Math.round(session.playerData.totalWaitTime / 60)}m */}
        </Text>
      </Flex>
    </Box>
  );

  const bottomActions = (
    <Flex w="full" justify="flex-end" gap={2}>
      <NextLinkButton
        href={`/sessions/${session.id}`}
        colorPalette="gray"
        variant="outline"
        size="sm"
      >
        {t('view')}
      </NextLinkButton>
      <NextLinkButton href={`/player/sessions/${session.id}`} colorPalette="green" size="sm">
        <Eye className="mr-2 h-4 w-4" /> {t('viewSession')}
      </NextLinkButton>
    </Flex>
  );

  return (
    <BaseSessionCard
      session={session}
      extraInfoRows={
        <Stack gap={2}>
          {locationRow}
          {playerStats}
        </Stack>
      }
      bottomActionButtons={bottomActions}
    />
  );
}
