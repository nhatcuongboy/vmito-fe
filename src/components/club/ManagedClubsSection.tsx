'use client';

import ClubCardSkeleton from '@/components/club/ClubCardSkeleton';
import ManagedClubCard from '@/components/club/ManagedClubCard';
import { Button } from '@/components/ui/chakra-compat';
import { IMyClub } from '@/types/club';
import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IManagedClubsSectionProps {
  clubs: IMyClub[];
  isAdmin: boolean;
  isLoading: boolean;
  canCreateClub: boolean;
  onCreate: () => void;
  onDelete: (club: IMyClub) => void;
}

const ManagedClubsSection = ({
  clubs,
  isAdmin,
  isLoading,
  canCreateClub,
  onCreate,
  onDelete,
}: IManagedClubsSectionProps) => {
  const t = useTranslations();

  if (isLoading) {
    return (
      <Box>
        <HStack mb={{ base: 4, md: 6 }} gap={2}>
          <Box boxSize="20px" bg="bg.muted" borderRadius="sm" />
          <Box h="28px" w="180px" bg="bg.muted" borderRadius="md" />
          <Box h="20px" w="32px" bg="bg.muted" borderRadius="full" />
        </HStack>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          gap={{ base: 4, md: 6 }}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <ClubCardSkeleton key={index} />
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Box>
      <HStack
        mb={{ base: 4, md: 6 }}
        gap={2}
        justify="space-between"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <HStack gap={2} flex={{ base: '1 1 100%', md: 'initial' }} minW={0}>
          <Shield size={20} />
          <Heading size={{ base: 'md', md: 'lg' }} lineClamp={1}>
            {isAdmin
              ? t('clubs.adminManagingGroups')
              : t('clubs.managingGroups')}
          </Heading>
          <Badge
            colorPalette="green"
            variant="subtle"
            borderRadius="full"
            px={2}
          >
            {clubs.length}
          </Badge>
        </HStack>

        {canCreateClub && (
          <Button
            colorPalette="green"
            size="sm"
            display={{ base: 'none', md: 'inline-flex' }}
            ml={{ base: 'auto', md: 0 }}
            onClick={onCreate}
          >
            <Plus size={16} />
            {t('navigation.createClub')}
          </Button>
        )}
      </HStack>

      {clubs.length === 0 ? (
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
          <Text fontSize={{ base: 'sm', md: 'md' }} color="fg.muted">
            {isAdmin ? t('clubs.noSystemClubs') : t('clubs.noManagedClubs')}
          </Text>
          {canCreateClub && (
            <Button colorPalette="green" variant="outline" onClick={onCreate}>
              <Plus size={16} />
              {t('clubs.createClub')}
            </Button>
          )}
        </VStack>
      ) : (
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          gap={{ base: 4, md: 6 }}
        >
          {clubs.map((club) => (
            <ManagedClubCard key={club.id} club={club} onDelete={onDelete} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default ManagedClubsSection;
