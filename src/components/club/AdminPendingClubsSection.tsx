'use client';

import AdminPendingClubCardSkeleton from '@/components/club/AdminPendingClubCardSkeleton';
import { Button } from '@/components/ui/chakra-compat';
import { IClub } from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Check, MapPin, Shield, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IAdminPendingClubsSectionProps {
  clubs: IClub[];
  isLoading: boolean;
  isActionLoading: boolean;
  onApprove: (clubId: string) => void;
  onReject: (clubId: string) => void;
}

const getClubHostName = (club: IClub) => club.host?.name || club.hostName || '';

const AdminPendingClubsSection = ({
  clubs,
  isLoading,
  isActionLoading,
  onApprove,
  onReject,
}: IAdminPendingClubsSectionProps) => {
  const t = useTranslations();

  return (
    <Box mt={{ base: 8, md: 12 }}>
      <HStack mb={{ base: 4, md: 6 }} gap={2}>
        <Shield size={20} />
        <Heading size={{ base: 'md', md: 'lg' }}>
          {t('clubs.adminApproval.title')}
        </Heading>
        {clubs.length > 0 && (
          <Badge
            colorPalette="yellow"
            variant="subtle"
            borderRadius="full"
            px={2}
          >
            {clubs.length}
          </Badge>
        )}
      </HStack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 4, md: 6 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <AdminPendingClubCardSkeleton key={index} />
          ))}
        </SimpleGrid>
      ) : clubs.length === 0 ? (
        <VStack
          py={{ base: 10, md: 12 }}
          bg="bg.muted"
          _dark={{ bg: 'gray.900/40' }}
          borderRadius={{ base: 'xl', md: '2xl' }}
          gap={4}
          borderWidth="1px"
          borderStyle="dashed"
        >
          <Shield size={48} color="#A0AEC0" />
          <Text color="fg.muted">
            {t('clubs.adminApproval.noPendingClubs')}
          </Text>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 4, md: 6 }}>
          {clubs.map((club) => (
            <Box
              key={club.id}
              p={{ base: 4, md: 6 }}
              bg="bg"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              borderRadius={{ base: 'xl', md: '2xl' }}
              borderWidth="1px"
              borderColor="border"
              transition="box-shadow 0.2s"
              _hover={{ shadow: 'md' }}
            >
              <Flex gap={{ base: 3, md: 4 }}>
                <Box
                  boxSize={{ base: '76px', md: '100px' }}
                  borderRadius="lg"
                  overflow="hidden"
                  bg="gray.100"
                  flexShrink={0}
                >
                  {club.image ? (
                    <Image
                      src={club.image}
                      alt={club.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  ) : (
                    <Flex
                      w="full"
                      h="full"
                      align="center"
                      justify="center"
                      bg={club.color || 'green.500'}
                    >
                      <Users size={32} color="white" />
                    </Flex>
                  )}
                </Box>

                <VStack align="start" flex={1} minW={0} gap={2}>
                  <HStack justify="space-between" w="full" gap={2}>
                    <Heading size={{ base: 'xs', md: 'sm' }} lineClamp={1}>
                      {club.name}
                    </Heading>
                    <Badge colorPalette="yellow" size="sm" flexShrink={0}>
                      {t('clubs.clubStatus.pending')}
                    </Badge>
                  </HStack>
                  <HStack fontSize="sm" color="fg.muted" minW={0}>
                    <MapPin size={14} />
                    <Text lineClamp={1}>
                      {club.location || t('common.notSpecified')}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="sm"
                    lineClamp={2}
                    color="fg.muted"
                    dangerouslySetInnerHTML={{
                      __html: club.description || t('clubs.noDescription'),
                    }}
                    css={{
                      '& p': { display: 'inline' },
                      '& br': { display: 'none' },
                      '& *': { margin: 0, padding: 0 },
                    }}
                  />
                  <HStack pt={1} fontSize="xs" color="fg.muted" minW={0}>
                    <Text flexShrink={0}>{t('clubs.hostedBy')}</Text>
                    <Text fontWeight="medium" lineClamp={1}>
                      {getClubHostName(club) || t('common.notSpecified')}
                    </Text>
                  </HStack>
                </VStack>
              </Flex>

              <Flex mt={{ base: 4, md: 6 }} gap={3}>
                <Button
                  flex={1}
                  colorPalette="green"
                  onClick={() => onApprove(club.id)}
                  loading={isActionLoading}
                >
                  <Check size={18} />
                  {t('clubs.approve')}
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  colorPalette="red"
                  onClick={() => onReject(club.id)}
                  loading={isActionLoading}
                >
                  <X size={18} />
                  {t('clubs.reject')}
                </Button>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default AdminPendingClubsSection;
