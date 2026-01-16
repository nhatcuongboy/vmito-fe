'use client';

import { Button, SimpleGrid, VStack } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { Box, Flex, Heading, Text, Icon, Badge } from '@chakra-ui/react';
import { Award, Calendar, Clock, Copy, Info, MapPin, QrCode, Share2, Users, Activity, Play, Square, User, CheckCircle } from 'lucide-react';
import SessionPlayerStatistics from './SessionPlayerStatistics';
import { useTranslations } from 'next-intl';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { formatTime } from '@/utils/session-helpers';
import dayjs from '@/lib/dayjs';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface SessionOverviewTabProps {
  session: any;
  onToggleSessionStatus?: () => void;
  isToggleStatusLoading?: boolean;
}

export default function SessionOverviewTab({ session, onToggleSessionStatus, isToggleStatusLoading }: SessionOverviewTabProps) {
  const t = useTranslations('SessionDetail');
  const { getLevelLabel, getLevelShortLabel } = useLevelLabel();

  const handleCopyLink = () => {
    // Construct the join link (adjust based on your actual route structure)
    // Assuming /join/[code] or /sessions/[code]
    const joinLink = `${window.location.origin}/join`;
    navigator.clipboard.writeText(joinLink);
    toaster.create({
      title: 'Link copied to clipboard',
      type: 'success',
      duration: 2000,
    });
  };

  const handleCopyCode = () => {
     const joinCode = session.id.slice(-8).toUpperCase();
     navigator.clipboard.writeText(joinCode);
      toaster.create({
      title: 'Code copied to clipboard',
      type: 'success',
      duration: 2000,
    });
  }

  const joinCode = session.id.slice(-8).toUpperCase();

  const totalPlayers = session.players?.length || 0;
  const waitingPlayers = session.players?.filter((p: any) => p.status === 'WAITING').length || 0;
  const playingPlayers = session.players?.filter((p: any) => p.status === 'PLAYING').length || 0;
  const readyPlayers = session.players?.filter((p: any) => p.status === 'READY').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING': return 'blue';
      case 'IN_PROGRESS': return 'green';
      case 'FINISHED': return 'gray';
      default: return 'gray';
    }
  };

  const statusColor = getStatusColor(session.status);

  return (
    <Box>
      <SimpleGrid spacing={8} columns={{ base: 1, md: 2 }} mb={8}>
        {/* Left Column: Session Info */}
        <Box as="section" h="full">
          <Box 
            p={6} 
            bg="white" 
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }} 
            borderRadius="xl" 
            shadow="sm" 
            border="1px solid" 
            borderColor="gray.100" 
            h="full"
          >
            <VStack spacing={6} align="stretch" h="full">
              <Box >
                <Heading size="lg" mb={2} color="gray.800" _dark={{ color: 'white' }}>{session.name}</Heading>
                
                {session.host?.name && (
                   <Flex align="center" mb={4} color="gray.500">
                      <Icon as={User} boxSize={4} mr={2} />
                      <Text fontSize="sm">{session.host.name}</Text>
                   </Flex>
                )}

                <Flex align="center" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                     <Box as={Info} boxSize={5} mr={3} color={`${statusColor}.500`} />
                     <Text fontSize="md" fontWeight="medium" color={`${statusColor}.600`}>
                        {session.status === 'PREPARING' ? t('notStarted') : 
                        session.status === 'IN_PROGRESS' ? t('inProgress') : t('finished')}
                     </Text>
                 </Flex>
                
                <Flex align="center" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={MapPin} boxSize={5} mr={3} color="blue.500" />
                    <Text fontSize="md" fontWeight="medium">{session.location || t('noLocation')}</Text>
                </Flex>

                <Flex align="center" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={Calendar} boxSize={5} mr={3} color="purple.500" />
                     <Text fontSize="md" textTransform="capitalize">
                        {session.startTime ? dayjs(session.startTime).format('dddd, DD MMMM YYYY') : t('notScheduled')}
                     </Text>
                </Flex>

                <Flex align="center" mb={4} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={Clock} boxSize={5} mr={3} color="green.500" />
                    <Text fontSize="md">
                       {session.startTime ? formatTime(session.startTime) : '--:--'} - {session.endTime ? formatTime(session.endTime) : '--:--'}
                    </Text>
                </Flex>

                <Flex align="start" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={Award} boxSize={5} mr={3} color="orange.500" mt={1} />
                    <Box>
                        <Text fontSize="md" fontWeight="medium" mb={1}>{t('requiredLevels')}:</Text>
                        <Flex gap={2} flexWrap="wrap">
                            {session.requiredLevels && session.requiredLevels.length > 0 
                                ? session.requiredLevels.map((level: number) => (
                                    <Box 
                                        key={level} 
                                        px={2.5} 
                                        py={0.5} 
                                        bg="orange.50" 
                                        color="orange.700" 
                                        borderRadius="full" 
                                        fontSize="sm" 
                                        fontWeight="semibold"
                                        border="1px solid"
                                        borderColor="orange.100"
                                    >
                                        {getLevelShortLabel(level)}
                                    </Box>
                                ))
                                : <Text>{t('allLevels')}</Text>
                            }
                        </Flex>
                    </Box>
                </Flex>
                   {session.description && (
                   <Flex align="center">
                       <Box as={Info} boxSize={5} mr={3} mt={1} color="gray.400" />
                       <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm" lineHeight="tall">
                           {session.description}
                       </Text>
                   </Flex>
              )}

              </Box>

           
              {onToggleSessionStatus && session.status !== 'FINISHED' && (
                     <Flex mt={6} justify="center">
                        <Button 
                            colorScheme={session.status === 'PREPARING' ? 'blue' : 'red'}
                            size="lg"
                            px={8}
                            onClick={onToggleSessionStatus}
                            loading={isToggleStatusLoading}
                            leftIcon={session.status === 'PREPARING' ? <Play size={20}/> : <Square size={20}/>}
                        >
                            {session.status === 'PREPARING' ? `${t('start')} ${t('title')}` : t('endSession')}
                        </Button>
                     </Flex>
                )}
            </VStack>
          </Box>
        </Box>

        {/* Right Column: Join Session Card */}
        <Box as="section">
           <Box 
              p={8} 
              bg="white" 
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }} 
              borderRadius="xl" 
              shadow="sm" 
              border="1px solid" 
              borderColor="gray.100"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              h="full"
            >
                <Heading size="md" mb={2} color="gray.800" _dark={{ color: 'white' }}>QR Code</Heading>
                
                <Box p={4} bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
                    <QRCodeGenerator joinCode={joinCode} size={200} />
                </Box>

            </Box>
        </Box>
      </SimpleGrid>

       {/* Session Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} >
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
            <Box p={2} bg="blue.50" color="blue.500" borderRadius="lg" mr={3}>
              <Users size={20} />
            </Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">{t('players')}</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" _dark={{ color: 'white' }}>{totalPlayers}</Text>
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
            <Box p={2} bg="orange.50" color="orange.500" borderRadius="lg" mr={3}>
              <Clock size={20} />
            </Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" textTransform="capitalize">{t('waiting')}</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" _dark={{ color: 'white' }}>{waitingPlayers}</Text>
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
            <Box p={2} bg="green.50" color="green.500" borderRadius="lg" mr={3}>
              <Activity size={20} />
            </Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" textTransform="capitalize">{t('playing')}</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" _dark={{ color: 'white' }}>{playingPlayers}</Text>
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
            <Box p={2} bg="teal.50" color="teal.500" borderRadius="lg" mr={3}>
              <CheckCircle size={20} />
            </Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" textTransform="capitalize">{t('playersTab.ready')}</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" _dark={{ color: 'white' }}>{readyPlayers}</Text>
        </Box>
      </SimpleGrid>

      <Box mt={8}>
          <Heading size="md" mb={4}>{t('playersTab.playerStatistics')}</Heading>
          <SessionPlayerStatistics sessionId={session.id} />
      </Box>
    </Box>
  );
}
