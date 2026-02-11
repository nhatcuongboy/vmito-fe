'use client';

import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Button, SimpleGrid, VStack } from '@/components/ui/chakra-compat';
import { ISession, Player, SessionStatus } from '@/lib/api/types';
import {
  Badge,
  Box,
  Flex,
  FlexProps,
  Heading,
  Text,
  Image,
} from '@chakra-ui/react';
import {
  Activity,
  CheckCircle,
  Clock,
  DoorOpen,
  Play,
  Shield,
  Square,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import SessionInfo from './SessionInfo';
import SessionPlayers from './SessionPlayers';
import { RatePlayersSection } from '@/components/rating';

interface InfoRowProps extends FlexProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

const InfoRow = ({ icon, label, children, ...props }: InfoRowProps) => (
  <Flex align="start" mb={3} {...props}>
    <Box
      as={icon}
      boxSize={5}
      mr={3}
      mt={0.5}
      color="gray.400"
      flexShrink={0}
    />
    <Text
      fontSize="md"
      color="gray.600"
      _dark={{ color: 'gray.400' }}
      mr={2}
      minW="fit-content"
      fontWeight="normal"
    >
      {label}:
    </Text>
    <Box
      flex={1}
      color="gray.800"
      _dark={{ color: 'gray.100' }}
      fontWeight="medium"
    >
      {children}
    </Box>
  </Flex>
);

interface SessionOverviewTabProps {
  session: ISession;
  onToggleSessionStatus?: () => void;
  isToggleStatusLoading?: boolean;
}

export default function SessionOverviewTab({
  session,
  onToggleSessionStatus,
  isToggleStatusLoading,
}: SessionOverviewTabProps) {
  const t = useTranslations('SessionDetail');

  const joinCode = session.id.slice(-8).toUpperCase();

  const totalPlayers = session.players?.length || 0;
  const waitingPlayers =
    session.players?.filter((p: Player) => p.status === 'WAITING').length || 0;
  const playingPlayers =
    session.players?.filter((p: Player) => p.status === 'PLAYING').length || 0;
  const readyPlayers =
    session.players?.filter((p: Player) => p.status === 'READY').length || 0;

  return (
    <Box>
      {/* Cover Photo Section */}
      {session.coverPhoto && (
        <Box mb={8} borderRadius="xl" overflow="hidden" boxShadow="md">
          <Image
            src={session.coverPhoto}
            alt={session.name}
            w="100%"
            h={{ base: '200px', md: '300px' }}
            objectFit="cover"
          />
        </Box>
      )}

      <SimpleGrid spacing={8} columns={{ base: 1, md: 2 }} mb={8}>
        {/* Left Column: Session Info */}
        <Box as="section" h="full">
          <Box
            p={6}
            bg={{ base: 'white', _dark: 'gray.800' }}
            _dark={{ borderColor: 'gray.700' }}
            borderRadius="xl"
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            h="full"
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="gray.500"
              mb={4}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {t('information')}
            </Text>

            <SessionInfo session={session} />

            {onToggleSessionStatus && session.status !== 'FINISHED' && (
              <Flex mt={6} justify="center">
                <Button
                  colorPalette={
                    session.status === 'PREPARING' ? 'green' : 'red'
                  }
                  size="lg"
                  px={8}
                  onClick={onToggleSessionStatus}
                  loading={isToggleStatusLoading}
                  leftIcon={
                    session.status === 'PREPARING' ? (
                      <Play size={20} />
                    ) : (
                      <Square size={20} />
                    )
                  }
                >
                  {session.status === 'PREPARING'
                    ? `${t('start')} ${t('title')}`
                    : t('endSession')}
                </Button>
              </Flex>
            )}
          </Box>
        </Box>

        {/* Right Column: Join Session Card */}
        <Box as="section" h="full">
          <Box
            p={6}
            bg={{ base: 'white', _dark: 'gray.800' }}
            _dark={{ borderColor: 'gray.700' }}
            borderRadius="xl"
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            display="flex"
            flexDirection="column"
            alignItems="center"
            h="full"
          >
            <Box w="full" mb={6}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('settings')}
              </Text>
              <VStack align="start" spacing={3}>
                <InfoRow icon={Shield} label={t('requirePlayerInfo')}>
                  <Badge
                    colorPalette={session.requirePlayerInfo ? 'green' : 'gray'}
                  >
                    {session.requirePlayerInfo ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>

                <InfoRow icon={UserPlus} label={t('allowGuestJoin')}>
                  <Badge
                    colorPalette={session.allowGuestJoin ? 'green' : 'gray'}
                  >
                    {session.allowGuestJoin ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>

                <InfoRow icon={DoorOpen} label={t('allowNewPlayers')}>
                  <Badge
                    colorPalette={session.allowNewPlayers ? 'green' : 'gray'}
                  >
                    {session.allowNewPlayers ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>
              </VStack>
            </Box>

            <Box
              w="full"
              h="1px"
              bg="gray.100"
              _dark={{ bg: 'gray.700' }}
              mb={6}
            />

            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              <QRCodeGenerator joinCode={joinCode} size={200} />
            </Box>
          </Box>
        </Box>
      </SimpleGrid>

      {/* Session Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Box
          p={4}
          bg={{ base: 'white', _dark: 'gray.800' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'blue.50', _dark: 'blue.900/30' }}
              color="green.500"
              borderRadius="lg"
              mr={3}
            >
              <Users size={20} />
            </Box>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              {t('playersTab.players')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {totalPlayers}
          </Text>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'orange.50', _dark: 'orange.900/30' }}
              color="orange.500"
              borderRadius="lg"
              mr={3}
            >
              <Clock size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('waiting')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {waitingPlayers}
          </Text>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'green.50', _dark: 'green.900/30' }}
              color="green.500"
              borderRadius="lg"
              mr={3}
            >
              <Activity size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('playing')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {playingPlayers}
          </Text>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'teal.50', _dark: 'teal.900/30' }}
              color="teal.500"
              borderRadius="lg"
              mr={3}
            >
              <CheckCircle size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('playersTab.ready')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {readyPlayers}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Rate Players Section - Show when session is FINISHED */}
      {session.status === SessionStatus.FINISHED && session.players && (
        <Box mt={8}>
          <RatePlayersSection
            sessionId={session.id}
            players={session.players}
          />
        </Box>
      )}

      <Box mt={8}>
        <Heading size="md" mb={4}>
          {t('playersTab.playerStatistics')}
        </Heading>
        <SessionPlayers sessionId={session.id} />
      </Box>
    </Box>
  );
}
