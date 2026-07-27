'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Spinner,
  Tabs,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { MessageSquare, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClubAnnouncement } from '@/types/club';

interface IClubAnnouncementsTabProps {
  clubId: string;
  isUserAdmin: boolean;
}

interface IAnnouncementFormState {
  title: string;
  content: string;
  pinnedUntil: string;
}

const emptyForm: IAnnouncementFormState = {
  title: '',
  content: '',
  pinnedUntil: '',
};

export const ClubAnnouncementsTab = ({
  clubId,
  isUserAdmin,
}: IClubAnnouncementsTabProps) => {
  const t = useTranslations();
  const [announcements, setAnnouncements] = useState<IClubAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<IClubAnnouncement | null>(null);
  const [form, setForm] = useState<IAnnouncementFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<IClubAnnouncement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ClubsService.getClubAnnouncements(clubId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load club announcements:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    setForm(emptyForm);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (announcement: IClubAnnouncement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      pinnedUntil: announcement.pinnedUntil
        ? announcement.pinnedUntil.slice(0, 10)
        : '',
    });
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingAnnouncement(null);
    setForm(emptyForm);
  };

  const handleSubmitForm = async () => {
    if (!form.title.trim() || !form.content.trim()) return;

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      pinnedUntil: form.pinnedUntil
        ? new Date(form.pinnedUntil).toISOString()
        : undefined,
    };

    try {
      setIsSaving(true);
      if (editingAnnouncement) {
        await ClubsService.updateAnnouncement(
          clubId,
          editingAnnouncement.id,
          payload
        );
        toaster.success({ title: t('clubs.announcementUpdated') });
      } else {
        await ClubsService.createAnnouncement(clubId, payload);
        toaster.success({ title: t('clubs.announcementCreated') });
      }
      handleCloseFormModal();
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to save club announcement:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      setIsDeleting(true);
      await ClubsService.deleteAnnouncement(clubId, announcementToDelete.id);
      toaster.success({ title: t('clubs.announcementDeleted') });
      setAnnouncementToDelete(null);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete club announcement:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Tabs.Content value="announcements" pt={0}>
        <Box
          p={6}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.100"
          shadow="sm"
        >
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={3}
            mb={5}
          >
            <Heading size="md">{t('clubs.announcementsTab')}</Heading>
            {isUserAdmin && (
              <Button
                size="sm"
                colorPalette="green"
                onClick={handleOpenCreateModal}
              >
                <Plus size={16} />
                {t('clubs.createAnnouncement')}
              </Button>
            )}
          </Flex>

          {isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" colorPalette="green" />
            </Flex>
          ) : announcements.length > 0 ? (
            <VStack gap={4} align="stretch">
              {announcements.map((announcement) => (
                <Box
                  key={announcement.id}
                  p={5}
                  bg="gray.50"
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                >
                  <Flex justify="space-between" align="start" mb={3} gap={2}>
                    <Heading size="sm">{announcement.title}</Heading>
                    <HStack gap={1} flexShrink={0}>
                      {announcement.pinnedUntil &&
                        new Date(announcement.pinnedUntil) > new Date() && (
                          <Badge colorPalette="orange" size="sm">
                            Pinned
                          </Badge>
                        )}
                      {isUserAdmin && (
                        <>
                          <IconButton
                            aria-label={t('clubs.editAnnouncement')}
                            icon={<Pencil size={14} />}
                            size="xs"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(announcement)}
                          />
                          <IconButton
                            aria-label={t('clubs.deleteAnnouncement')}
                            icon={<Trash2 size={14} />}
                            size="xs"
                            colorPalette="red"
                            variant="ghost"
                            onClick={() =>
                              setAnnouncementToDelete(announcement)
                            }
                          />
                        </>
                      )}
                    </HStack>
                  </Flex>
                  <Text
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    lineHeight="tall"
                    mb={4}
                    whiteSpace="pre-wrap"
                  >
                    {announcement.content}
                  </Text>
                  <Flex justify="space-between" align="center">
                    <HStack gap={2}>
                      <Avatar.Root size="sm">
                        <Avatar.Image
                          src={announcement.author.image}
                          objectFit="cover"
                        />
                        <Avatar.Fallback>
                          {announcement.author.name[0]}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <Text fontSize="sm" fontWeight="medium">
                        {announcement.author.name}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={10}
              color="gray.400"
              gap={2}
            >
              <MessageSquare size={40} strokeWidth={1.2} />
              <Text fontSize="sm" fontStyle="italic">
                {t('clubs.noAnnouncements')}
              </Text>
              {isUserAdmin && (
                <Button
                  mt={3}
                  size="sm"
                  colorPalette="green"
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={16} />
                  {t('clubs.createAnnouncement')}
                </Button>
              )}
            </Flex>
          )}
        </Box>
      </Tabs.Content>

      <VModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          editingAnnouncement
            ? t('clubs.editAnnouncement')
            : t('clubs.createAnnouncement')
        }
        size="lg"
        primaryActionText={t('common.save')}
        onPrimaryAction={handleSubmitForm}
        isPrimaryLoading={isSaving}
        isPrimaryDisabled={!form.title.trim() || !form.content.trim()}
        secondaryActionText={t('common.cancel')}
        isSecondaryDisabled={isSaving}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('clubs.announcementTitle')}
            </Text>
            <Input
              value={form.title}
              maxLength={100}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('clubs.announcementContent')}
            </Text>
            <Textarea
              value={form.content}
              maxLength={5000}
              rows={6}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              {t('clubs.pinUntil')}
            </Text>
            <Input
              type="date"
              value={form.pinnedUntil}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pinnedUntil: event.target.value,
                }))
              }
            />
          </Box>
        </VStack>
      </VModal>

      <VModal
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        title={t('clubs.deleteAnnouncement')}
        size="sm"
        primaryActionText={t('common.remove')}
        onPrimaryAction={handleConfirmDelete}
        isPrimaryLoading={isDeleting}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isSecondaryDisabled={isDeleting}
      >
        <Text color="fg.muted">{t('clubs.confirmDeleteAnnouncement')}</Text>
      </VModal>
    </>
  );
};
