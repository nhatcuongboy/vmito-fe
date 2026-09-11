'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  IconButton,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/chakra-compat';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/VTable';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { WelcomePopupService } from '@/lib/api/welcome-popup.service';
import { IWelcomePopup } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import WelcomePopupFormModal from './WelcomePopupFormModal';

export default function AdminWelcomePopupsPage() {
  return (
    <Suspense>
      <AdminWelcomePopupsContent />
    </Suspense>
  );
}

function AdminWelcomePopupsContent() {
  const t = useTranslations('welcomePopup.admin');
  const tc = useTranslations('common');
  const ta = useTranslations('admin');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();

  const [popups, setPopups] = useState<IWelcomePopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPopup, setEditingPopup] = useState<IWelcomePopup | null>(null);
  const [popupToDelete, setPopupToDelete] = useState<IWelcomePopup | null>(
    null
  );
  const {
    isOpen: isFormOpen,
    onOpen: openForm,
    onClose: closeForm,
  } = useDisclosure(false);

  const fetchPopups = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await WelcomePopupService.getAdminList();
      setPopups(result);
    } catch (error) {
      console.error('Failed to fetch welcome popups:', error);
      toaster.error({ title: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: ta('accessDenied') });
      router.replace('/dashboard');
      return;
    }
    fetchPopups();
  }, [isHydrated, isAuthenticated, currentUser, router, ta, fetchPopups]);

  const handleCreate = () => {
    setEditingPopup(null);
    openForm();
  };

  const handleEdit = (popup: IWelcomePopup) => {
    setEditingPopup(popup);
    openForm();
  };

  const handleSaved = (saved: IWelcomePopup) => {
    setPopups((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved];
      return next.sort(
        (a, b) =>
          b.displayOrder - a.displayOrder ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    closeForm();
  };

  const handleDelete = async () => {
    if (!popupToDelete) return;
    try {
      setIsDeleting(true);
      await WelcomePopupService.remove(popupToDelete.id);
      setPopups((prev) => prev.filter((p) => p.id !== popupToDelete.id));
      toaster.success({ title: t('deleteSuccess') });
      setPopupToDelete(null);
    } catch (error) {
      console.error('Failed to delete welcome popup:', error);
      toaster.error({ title: t('deleteError') });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateRange = (popup: IWelcomePopup) => {
    if (!popup.startDate && !popup.endDate) return '—';
    const fmt = (v: string) => new Date(v).toLocaleDateString('vi-VN');
    return `${popup.startDate ? fmt(popup.startDate) : '…'} → ${
      popup.endDate ? fmt(popup.endDate) : '…'
    }`;
  };

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title={t('pageTitle')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          <Flex
            justify="space-between"
            align={{ base: 'start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <HStack gap={3}>
              <Box
                p={3}
                borderRadius="lg"
                bg="green.100"
                _dark={{ bg: 'green.900/30' }}
                color="green.600"
              >
                <MessageSquareText size={24} />
              </Box>
              <Box>
                <Heading size="lg">{t('pageTitle')}</Heading>
                <Text color="fg.muted">{t('pageDescription')}</Text>
              </Box>
            </HStack>
            <Button colorPalette="green" onClick={handleCreate}>
              <Plus size={18} />
              {t('createButton')}
            </Button>
          </Flex>

          <TableContainer isLoading={isLoading}>
            <Table>
              <Thead>
                <Tr>
                  <Th minW="200px">{t('columns.title')}</Th>
                  <Th w="90px">{t('columns.image')}</Th>
                  <Th w="90px">{t('columns.active')}</Th>
                  <Th w="90px">{t('columns.displayOrder')}</Th>
                  <Th w="200px">{t('columns.dateRange')}</Th>
                  <Th w="100px" textAlign="right">
                    {t('columns.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {popups.map((popup) => (
                  <Tr key={popup.id}>
                    <Td minW="200px">
                      <VStack gap={0} align="start">
                        <Text fontWeight="semibold" lineClamp={1}>
                          {popup.title}
                        </Text>
                        <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                          {popup.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td w="90px">
                      {popup.imageUrl && (
                        <Image
                          src={popup.imageUrl}
                          alt={popup.title}
                          boxSize="48px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      )}
                    </Td>
                    <Td w="90px">
                      <Badge colorPalette={popup.isActive ? 'green' : 'gray'}>
                        {popup.isActive ? t('active') : t('inactive')}
                      </Badge>
                    </Td>
                    <Td w="90px">{popup.displayOrder}</Td>
                    <Td w="200px" fontSize="sm" color="fg.muted">
                      {formatDateRange(popup)}
                    </Td>
                    <Td w="100px">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label="Edit popup"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(popup)}
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete popup"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => setPopupToDelete(popup)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {popups.length === 0 && !isLoading && (
              <VStack p={10} gap={3} color="fg.muted">
                <MessageSquareText size={40} />
                <Text fontWeight="medium">{t('emptyState')}</Text>
              </VStack>
            )}
          </TableContainer>
        </VStack>

        <WelcomePopupFormModal
          isOpen={isFormOpen}
          popup={editingPopup}
          onClose={closeForm}
          onSaved={handleSaved}
        />

        <VModal
          isOpen={!!popupToDelete}
          onClose={() => setPopupToDelete(null)}
          title={t('deleteConfirmTitle')}
          primaryActionText={t('deleteConfirmAction')}
          primaryColorScheme="red"
          onPrimaryAction={handleDelete}
          isPrimaryLoading={isDeleting}
          secondaryActionText={tc('cancel')}
        >
          <Text>{t('deleteConfirmBody')}</Text>
        </VModal>
      </Container>
    </MainLayout>
  );
}
