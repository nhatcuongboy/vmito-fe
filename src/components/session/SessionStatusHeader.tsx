'use client';

import { Box, Flex, Grid, Heading, Text, VStack } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { formatDuration, formatTime } from '@/utils/session-helpers';
import dayjs from '@/lib/dayjs';
import { Clock, Play, RefreshCw, Square, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SessionStatusHeaderProps {
  session: {
    status: string;
    startTime: string | null;
    endTime: string | null;
    players: Array<{ status: string }>;
  };
  refreshInterval: number;
  lastRefreshed: Date;
  isRefreshing: boolean;
  isToggleStatusLoading: boolean;
  onToggleSessionStatus: () => void;
  onRefreshData: () => void;
}

const SessionStatusHeader: React.FC<SessionStatusHeaderProps> = ({
  session,
  refreshInterval,
  lastRefreshed,
  isRefreshing,
  isToggleStatusLoading,
  onToggleSessionStatus,
  onRefreshData,
}) => {
  const t = useTranslations('SessionDetail');

  // Map session status to UI text
  const mapSessionStatusToUI = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return t('start');
      case 'IN_PROGRESS':
        return t('end');
      case 'FINISHED':
        return t('ended');
      default:
        return t('unknownStatus');
    }
  };

  // Map session status to color scheme
  const mapSessionStatusToColor = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'green';
      case 'IN_PROGRESS':
        return 'red';
      case 'FINISHED':
        return 'gray';
      default:
        return 'blue';
    }
  };

  return (
    <Grid templateColumns="repeat(3, 1fr)" gap={{ base: 2, md: 6 }} mb={8}>
      {/* Time Card */}
      <Box
        p={{ base: 3, md: 6 }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
      >
        <Flex align="center" justify="space-between" mb={{ base: 1, md: 2 }}>
          <Flex align="center">
            <Box
              as={Clock}
              boxSize={{ base: 4, md: 5 }}
              color="blue.500"
              mr={{ base: 1, md: 2 }}
            />
            <Heading
              size={{ base: 'sm', md: 'md' }}
              display={{ base: 'none', md: 'block' }}
            >
              {t('sessionTime')}
            </Heading>
            <Heading size="xs" display={{ base: 'block', md: 'none' }}>
              {t('sessionTime')}
            </Heading>
          </Flex>
          <Button
            colorScheme={mapSessionStatusToColor(session.status)}
            onClick={onToggleSessionStatus}
            disabled={session.status === 'FINISHED'}
            loading={isToggleStatusLoading}
            size={{ base: 'xs', md: 'sm' }}
            padding={0}
          >
            <Flex alignItems="center">
              <Box
                as={session.status === 'IN_PROGRESS' ? Square : Play}
                boxSize={{ base: 3, md: 4 }}
              />
            </Flex>
          </Button>
        </Flex>
        <Box display={{ base: 'none', md: 'block' }}>
          <VStack align="start" gap={2}>
            <Text fontWeight="medium">
              {`${formatTime(session.startTime!)}-${formatTime(
                session.endTime!
              )} (${
                session.startTime
                  ? dayjs(session.startTime).format('DD/MM/YY')
                  : ''
              })`}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {t('duration')}:{' '}
              {formatDuration(session.startTime!, session.endTime!)}
            </Text>
          </VStack>
        </Box>
        {/* Mobile simplified view */}
        <Box display={{ base: 'block', md: 'none' }}>
          <Text fontSize={'xs'}>
            {`${formatTime(session.startTime!)}-${formatTime(
              session.endTime!
            )} (${
              session.startTime
                ? dayjs(session.startTime).format('DD/MM/YY')
                : ''
            })`}
          </Text>
        </Box>
      </Box>

      {/* Players Card */}
      <Box
        p={{ base: 3, md: 6 }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
      >
        <Flex align="center" mb={{ base: 1, md: 2 }}>
          <Box
            as={Users}
            boxSize={{ base: 4, md: 5 }}
            color="blue.500"
            mr={{ base: 1, md: 2 }}
          />
          <Heading size={{ base: 'xs', md: 'md' }}>{t('players')}</Heading>
        </Flex>
        <Text fontSize={{ base: 'sm', md: 'lg' }}>
          {session.players.length} {t('total')}
        </Text>
        <Text
          fontSize={{ base: 'xs', md: 'sm' }}
          color="gray.500"
          display={{ base: 'none', md: 'block' }}
        >
          {session.players.filter((p) => p.status === 'PLAYING').length}{' '}
          {t('playing')} /{' '}
          {session.players.filter((p) => p.status === 'WAITING').length}{' '}
          {t('waiting')}
        </Text>
        {/* Mobile simplified view */}
        <Text
          fontSize="xs"
          color="gray.500"
          display={{ base: 'block', md: 'none' }}
        >
          {session.players.filter((p) => p.status === 'PLAYING').length}P/{' '}
          {session.players.filter((p) => p.status === 'WAITING').length}W
        </Text>
      </Box>

      {/* Updates Card */}
      <Box
        p={{ base: 3, md: 6 }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
      >
        <Flex
          align="center"
          mb={{ base: 1, md: 2 }}
          justifyContent="space-between"
        >
          <Flex align="center">
            <Box
              as={RefreshCw}
              boxSize={{ base: 4, md: 5 }}
              color="blue.500"
              mr={{ base: 1, md: 2 }}
            />
            <Heading
              size={{ base: 'xs', md: 'md' }}
              display={{ base: 'none', md: 'block' }}
            >
              {t('updates')}
            </Heading>
            <Heading size="xs" display={{ base: 'block', md: 'none' }}>
              {t('refresh')}
            </Heading>
          </Flex>
          {session.status === 'IN_PROGRESS' && (
            <IconButton
              aria-label="Refresh"
              icon={<Box as={RefreshCw} boxSize={{ base: 3, md: 4 }} />}
              size={{ base: 'xs', md: 'sm' }}
              isLoading={isRefreshing}
              onClick={onRefreshData}
            />
          )}
        </Flex>
        <Box display={{ base: 'none', md: 'block' }}>
          <Text fontSize="lg">
            {session.status === 'IN_PROGRESS'
              ? t('autoRefresh', { seconds: refreshInterval })
              : t('autoRefreshDisabled')}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {t('lastUpdated')}: {lastRefreshed.toLocaleTimeString()}
          </Text>
        </Box>
        {/* Mobile simplified view */}
        <Box display={{ base: 'block', md: 'none' }}>
          <Text fontSize="xs" color="gray.500">
            {session.status === 'IN_PROGRESS'
              ? `${refreshInterval}s`
              : t('off')}
          </Text>
        </Box>
      </Box>
    </Grid>
  );
};

export default SessionStatusHeader;
