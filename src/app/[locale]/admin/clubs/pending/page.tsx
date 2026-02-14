'use client';
import { Input } from '@/components/ui/Input';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Flex,
  Text,
  Badge,
  Spinner,
  Image,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  Check,
  X,
  Shield,
  MapPin,
  Users as UsersIcon,
  MessageSquare,
} from 'lucide-react';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import PageLayout from '@/components/layout/PageLayout';
import { Button, SimpleGrid } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';

const AdminClubApprovalPage = () => {
  const t = useTranslations();
  const [pendingClubs, setPendingClubs] = useState<IClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rejection State
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPendingClubs = async () => {
    try {
      setIsLoading(true);
      const clubs = await ClubsService.getPendingClubs();
      setPendingClubs(clubs);
    } catch (error) {
      console.error('Failed to fetch pending clubs:', error);
      toaster.create({
        title: t('clubs.failedToFetchClubs'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClubs();
  }, []);

  const handleApprove = async (clubId: string) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveClub(clubId);
      toaster.create({
        title: t('clubs.adminApproval.approveSuccess'),
        type: 'success',
      });
      fetchPendingClubs();
    } catch (error) {
      console.error('Failed to approve club:', error);
      toaster.create({
        title: t('common.error'),
        type: 'error',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenRejectDialog = (clubId: string) => {
    setSelectedClubId(clubId);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedClubId || !rejectionReason.trim()) return;

    try {
      setIsActionLoading(true);
      await ClubsService.rejectClub(selectedClubId, rejectionReason);
      toaster.create({
        title: t('clubs.adminApproval.rejectSuccess'),
        type: 'success',
      });
      setIsRejectDialogOpen(false);
      fetchPendingClubs();
    } catch (error) {
      console.error('Failed to reject club:', error);
      toaster.create({
        title: t('common.error'),
        type: 'error',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <PageLayout title={t('clubs.adminApproval.title')}>
      {isLoading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      ) : pendingClubs.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={20}
          bg="gray.50"
          _dark={{ bg: 'gray.800' }}
          borderRadius="xl"
          borderWidth="1px"
          borderStyle="dashed"
        >
          <Shield size={48} color="#A0AEC0" />
          <Text mt={4} fontSize="lg" color="gray.500">
            {t('clubs.adminApproval.noPendingClubs')}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          {pendingClubs.map((club) => (
            <Box
              key={club.id}
              p={6}
              bg="white"
              _dark={{ bg: 'gray.900' }}
              borderRadius="xl"
              shadow="sm"
              borderWidth="1px"
              _hover={{ shadow: 'md' }}
            >
              <Flex gap={4}>
                <Box
                  w="100px"
                  h="100px"
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
                      <UsersIcon size={32} color="white" />
                    </Flex>
                  )}
                </Box>
                <VStack align="start" flex={1} gap={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="xl">
                      {club.name}
                    </Text>
                    <Badge colorPalette="yellow">
                      {t('clubs.clubStatus.pending')}
                    </Badge>
                  </HStack>

                  <HStack
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                  >
                    <MapPin size={14} />
                    <Text>{club.location || t('common.notSpecified')}</Text>
                  </HStack>

                  <Text fontSize="sm" lineClamp={2} color="gray.500">
                    {club.description || t('clubs.noDescription')}
                  </Text>

                  <HStack pt={2} fontSize="xs" color="gray.400">
                    <Text>{t('clubs.hostedBy')}</Text>
                    <Text
                      fontWeight="medium"
                      color="gray.600"
                      _dark={{ color: 'gray.300' }}
                    >
                      {club.host.name}
                    </Text>
                  </HStack>
                </VStack>
              </Flex>

              <Flex mt={6} gap={3}>
                <Button
                  flex={1}
                  colorPalette="green"
                  onClick={() => handleApprove(club.id)}
                  loading={isActionLoading}
                >
                  <Check size={18} />
                  {t('clubs.approve')}
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  colorPalette="red"
                  onClick={() => handleOpenRejectDialog(club.id)}
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

      {/* Rejection Dialog */}
      <VModal
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        title={t('clubs.reject')}
        primaryActionText={t('clubs.reject')}
        onPrimaryAction={handleReject}
        isPrimaryLoading={isActionLoading}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isPrimaryDisabled={!rejectionReason.trim()}
      >
        <Field
          label={t('clubs.rejectionReason', { reason: '' }).replace(': ', '')}
          required
        >
          <Input
            placeholder={t('clubs.joinMessagePlaceholder')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </Field>
      </VModal>
    </PageLayout>
  );
};

export default AdminClubApprovalPage;
