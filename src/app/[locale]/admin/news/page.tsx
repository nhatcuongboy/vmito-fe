'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Pencil, Plus, ScrollText, Trash2 } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button, HStack, IconButton } from '@/components/ui/chakra-compat';
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
import { Link, useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { NewsService } from '@/lib/api/news.service';
import { EArticleStatus, IAdminArticle } from '@/types/news';
import { useAuthStore } from '@/stores/useAuthStore';
import ArticleFormModal from './ArticleFormModal';

export default function AdminNewsPage() {
  return (
    <Suspense>
      <AdminNewsContent />
    </Suspense>
  );
}

const STATUS_COLORS: Record<EArticleStatus, string> = {
  [EArticleStatus.PUBLISHED]: 'green',
  [EArticleStatus.DRAFT]: 'gray',
  [EArticleStatus.ARCHIVED]: 'orange',
};

function AdminNewsContent() {
  const t = useTranslations('admin.news');
  const tNews = useTranslations('pages.news');
  const ta = useTranslations('admin');
  const tc = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();

  const [articles, setArticles] = useState<IAdminArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingArticle, setEditingArticle] = useState<IAdminArticle | null>(
    null
  );
  const [articleToDelete, setArticleToDelete] = useState<IAdminArticle | null>(
    null
  );
  const {
    isOpen: isFormOpen,
    onOpen: openForm,
    onClose: closeForm,
  } = useDisclosure(false);

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await NewsService.getAdminList({ limit: 50 });
      setArticles(result.items);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
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
    void fetchArticles();
  }, [isHydrated, isAuthenticated, currentUser, router, ta, fetchArticles]);

  const handleCreate = () => {
    setEditingArticle(null);
    openForm();
  };

  const handleEdit = (article: IAdminArticle) => {
    setEditingArticle(article);
    openForm();
  };

  const handleSaved = (saved: IAdminArticle) => {
    setArticles((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      const next = exists
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev];
      return next.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    closeForm();
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;
    try {
      setIsDeleting(true);
      await NewsService.remove(articleToDelete.id);
      setArticles((prev) =>
        prev.filter((item) => item.id !== articleToDelete.id)
      );
      toaster.success({ title: t('deleteSuccess') });
      setArticleToDelete(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      toaster.error({ title: t('deleteError') });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout title={t('title')}>
      <Box bg="bg.subtle" minH="100%">
        <Container maxW="container.xl" py={{ base: 5, md: 8 }}>
          <VStack gap={5} align="stretch">
            <Flex align="center" gap={3} wrap="wrap">
              <Box
                p={2.5}
                borderRadius="lg"
                bg="green.100"
                _dark={{ bg: 'green.900/30' }}
                color="green.600"
                aria-hidden="true"
              >
                <ScrollText size={24} />
              </Box>
              <Box minW={0} flex="1">
                <Heading size="lg">{t('title')}</Heading>
                <Text color="fg.muted" fontSize={{ base: 'sm', md: 'md' }}>
                  {t('subtitle')}
                </Text>
              </Box>
              <Button colorPalette="green" onClick={handleCreate}>
                <Plus size={16} />
                {t('create')}
              </Button>
            </Flex>

            {isLoading ? (
              <Text color="fg.muted">{tc('loading')}</Text>
            ) : articles.length === 0 ? (
              <Text color="fg.muted">{t('empty')}</Text>
            ) : (
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>{t('columns.title')}</Th>
                      <Th>{t('columns.category')}</Th>
                      <Th>{t('columns.locale')}</Th>
                      <Th>{t('columns.status')}</Th>
                      <Th>{t('columns.views')}</Th>
                      <Th>{t('columns.actions')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {articles.map((article) => (
                      <Tr key={article.id}>
                        <Td>
                          <Text fontWeight="medium" lineClamp={1}>
                            {article.title}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            /{article.slug}
                          </Text>
                        </Td>
                        <Td>{tNews(`categories.${article.category}`)}</Td>
                        <Td>{article.locale}</Td>
                        <Td>
                          <Badge
                            colorPalette={STATUS_COLORS[article.status]}
                            variant="subtle"
                          >
                            {t(`form.statuses.${article.status}`)}
                          </Badge>
                          {article.isFeatured && (
                            <Badge
                              ml={1}
                              colorPalette="purple"
                              variant="subtle"
                            >
                              {t('featured')}
                            </Badge>
                          )}
                        </Td>
                        <Td>{article.viewCount}</Td>
                        <Td>
                          <HStack gap={1}>
                            {article.status === EArticleStatus.PUBLISHED && (
                              <Link
                                href={`/news/${article.slug}`}
                                locale={article.locale}
                              >
                                <IconButton
                                  aria-label={t('view')}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <ExternalLink size={16} />
                                </IconButton>
                              </Link>
                            )}
                            <IconButton
                              aria-label={tc('edit')}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(article)}
                            >
                              <Pencil size={16} />
                            </IconButton>
                            <IconButton
                              aria-label={tc('delete')}
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => setArticleToDelete(article)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </VStack>
        </Container>
      </Box>

      <ArticleFormModal
        isOpen={isFormOpen}
        article={editingArticle}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <VModal
        isOpen={!!articleToDelete}
        onClose={() => setArticleToDelete(null)}
        title={t('deleteTitle')}
        primaryActionText={tc('delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isDeleting}
      >
        <Text>
          {t('deleteConfirm', { title: articleToDelete?.title ?? '' })}
        </Text>
      </VModal>
    </MainLayout>
  );
}
