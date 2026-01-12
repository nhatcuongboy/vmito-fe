'use client';

import { Button, SimpleGrid, VStack } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { Box, Flex, Heading, Text, Icon } from '@chakra-ui/react';
import { Award, Calendar, Clock, Copy, Info, MapPin, QrCode, Share2 } from 'lucide-react';
import SessionPlayerStatistics from './SessionPlayerStatistics';
import { useTranslations } from 'next-intl';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { formatTime } from '@/utils/session-helpers';
import dayjs from '@/lib/dayjs';

interface SessionOverviewTabProps {
  session: any;
}

export default function SessionOverviewTab({ session }: SessionOverviewTabProps) {
  const t = useTranslations('SessionDetail');

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

  return (
    <Box>
      <SimpleGrid spacing={8} columns={{ base: 1, md: 2 }}>
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
              <Box>
                <Heading size="lg" mb={4} color="gray.800" _dark={{ color: 'white' }}>{session.name}</Heading>
                
                <Flex align="center" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={MapPin} boxSize={5} mr={3} color="blue.500" />
                    <Text fontSize="md" fontWeight="medium">{session.location || t('noLocation')}</Text>
                </Flex>

                <Flex align="center" mb={3} color="gray.600" _dark={{ color: 'gray.400' }}>
                    <Box as={Calendar} boxSize={5} mr={3} color="purple.500" />
                     <Text fontSize="md">
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
                                ? session.requiredLevels.map((level: string) => (
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
                                        {level}
                                    </Box>
                                ))
                                : <Text>{t('allLevels')}</Text>
                            }
                        </Flex>
                    </Box>
                </Flex>
              </Box>

              {session.description && (
                <Box pt={6} borderTop="1px dashed" borderColor="gray.200">
                   <Flex align="start">
                       <Box as={Info} boxSize={5} mr={3} mt={1} color="gray.400" />
                       <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm" lineHeight="tall">
                           {session.description}
                       </Text>
                   </Flex>
                </Box>
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

      <Box mt={8}>
          <Heading size="md" mb={4}>{t('playersTab.playerStatistics')}</Heading>
          <SessionPlayerStatistics sessionId={session.id} />
      </Box>
    </Box>
  );
}
