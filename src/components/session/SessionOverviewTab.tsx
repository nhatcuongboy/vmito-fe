'use client';

import { useState } from 'react';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Button, SimpleGrid, VStack } from '@/components/ui/chakra-compat';
import { VDrawer } from '@/components/ui/VDrawer';
import { ISession, Player, SessionStatus } from '@/lib/api/types';
import {
  Badge,
  Box,
  Flex,
  FlexProps,
  Grid,
  Heading,
  Text,
  Image,
} from '@chakra-ui/react';
import {
  Activity,
  CheckCircle,
  Clock,
  DoorOpen,
  Pencil,
  Play,
  Shield,
  Square,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import SessionInfo from './SessionInfo';
import SessionEditForm from './SessionEditForm';
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
  refreshSessionData?: () => void;
}

export default function SessionOverviewTab({
  session,
  onToggleSessionStatus,
  isToggleStatusLoading,
  refreshSessionData,
}: SessionOverviewTabProps) {
  const t = useTranslations('SessionDetail');
  const locale = useLocale();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const joinCode = session.id.slice(-8).toUpperCase();

  const totalPlayers = session.players?.length || 0;
  const waitingPlayers =
    session.players?.filter((p: Player) => p.status === 'WAITING').length || 0;
  const playingPlayers =
    session.players?.filter((p: Player) => p.status === 'PLAYING').length || 0;
  const readyPlayers =
    session.players?.filter((p: Player) => p.status === 'READY').length || 0;
  const maxPlayers = session.numberOfCourts * (session.maxPlayersPerCourt || 4);
  const fillPercent =
    maxPlayers > 0 ? Math.round((totalPlayers / maxPlayers) * 100) : 0;

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

      <Grid templateColumns={{ base: '1fr', md: '3fr 2fr' }} gap={8} mb={8}>
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
            <Flex align="center" justify="space-between" mb={4}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('information')}
              </Text>
              <Button
                size="xs"
                variant="outline"
                colorPalette="green"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Pencil size={13} />}
              >
                {t('edit')}
              </Button>
            </Flex>

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
                    ? `${t('start')}`
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
              <QRCodeGenerator
                joinCode={joinCode}
                size={200}
                url={`/${locale}/sessions/${session.id}`}
                label={t('qrScanToView')}
                hideCode
              />
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Fill Rate Banner - visible when IN_PROGRESS */}
      {/* {session.status === SessionStatus.IN_PROGRESS && (
        <Box
          mb={4}
          p={4}
          bg="green.50"
          _dark={{ bg: 'green.900/20', borderColor: 'green.800' }}
          borderRadius="xl"
          border="1px solid"
          borderColor="green.100"
        >
          <Flex align="center" justify="space-between" mb={2}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="green.700"
              _dark={{ color: 'green.300' }}
            >
              {t('fillRate')}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="green.700"
              _dark={{ color: 'green.300' }}
            >
              {totalPlayers} / {maxPlayers} ({fillPercent}%)
            </Text>
          </Flex>
          <Box
            h="8px"
            bg="green.100"
            _dark={{ bg: 'green.800' }}
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              bg={fillPercent >= 80 ? 'orange.400' : 'green.500'}
              borderRadius="full"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </Box>
        </Box>
      )} */}

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
              bg={{ base: 'brand.50', _dark: 'brand.900/30' }}
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
          <Flex align="baseline" gap={1.5}>
            <Text fontSize="2xl" fontWeight="bold" color="fg">
              {totalPlayers}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              / {maxPlayers}
            </Text>
          </Flex>
          <Box
            mt={2}
            h="4px"
            bg="gray.100"
            _dark={{ bg: 'gray.600' }}
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              bg={fillPercent >= 80 ? 'orange.400' : 'green.400'}
              borderRadius="full"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </Box>
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

      {/* Edit Session Drawer */}
      <VDrawer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('editSession')}
        size="lg"
        placement="right"
        hideSecondaryAction
        showCloseButton
      >
        <SessionEditForm
          sessionId={session.id}
          onSuccess={() => {
            setIsEditModalOpen(false);
            refreshSessionData?.();
          }}
        />
      </VDrawer>
    </Box>
  );
}
