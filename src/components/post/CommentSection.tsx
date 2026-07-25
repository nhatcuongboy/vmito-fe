'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { Send, Trash2 } from 'lucide-react';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import type { PostComment } from '@/types/post';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { PostAvatar } from './PostAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { Box, Flex } from '@chakra-ui/react';
import VModal from '@/components/ui/VModal';

const localeMap: Record<string, Locale> = { vi, en: enUS, cn: zhCN };

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  initialCommentCount?: number;
  onCommentCountChange?: (nextCount: number) => void;
}

export function CommentSection({
  postId,
  currentUserId,
  initialCommentCount = 0,
  onCommentCountChange,
}: CommentSectionProps) {
  const t = useTranslations('posts');
  const locale = useLocale();
  const dateLocale = localeMap[locale] || enUS;
  const currentUser = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState<string | null>(
    null
  );
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const loadComments = useCallback(
    async (pageNum = 1) => {
      setIsLoading(true);
      try {
        const response = await postsService.getComments(postId, pageNum);
        const responseComments = Array.isArray(response.comments)
          ? response.comments
          : [];
        const nextTotal = response.total ?? responseComments.length;

        if (pageNum === 1) {
          setComments(responseComments);
        } else {
          setComments((prev) => [...prev, ...responseComments]);
        }
        setHasMore(Boolean(response.hasMore));
        setPage(pageNum);
        if (pageNum === 1) {
          setCommentCount(nextTotal);
          onCommentCountChange?.(nextTotal);
        }
      } catch {
        toaster.create({
          title: t('error'),
          description: t('loadCommentsError'),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onCommentCountChange, postId, t]
  );

  useEffect(() => {
    loadComments();
  }, [postId, loadComments]);

  useEffect(() => {
    setCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await postsService.createComment(postId, newComment);
      setComments((prev) => [comment, ...prev]);
      const nextCount = commentCount + 1;
      setCommentCount(nextCount);
      onCommentCountChange?.(nextCount);
      setNewComment('');
      toaster.create({
        title: t('success'),
        description: t('commentAdded'),
        type: 'success',
      });
    } catch {
      toaster.create({
        title: t('error'),
        description: t('commentAddError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!commentIdToDelete) return;
    setIsDeletingComment(true);
    try {
      await postsService.deleteComment(commentIdToDelete);
      setComments((prev) => prev.filter((c) => c.id !== commentIdToDelete));
      const nextCount = Math.max(commentCount - 1, 0);
      setCommentCount(nextCount);
      onCommentCountChange?.(nextCount);
      toaster.create({
        title: t('success'),
        description: t('commentDeleted'),
        type: 'success',
      });
    } catch {
      toaster.create({
        title: t('error'),
        description: t('commentDeleteError'),
        type: 'error',
      });
    } finally {
      setIsDeletingComment(false);
      setCommentIdToDelete(null);
    }
  };

  return (
    <Box
      borderTopWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
      bg={{ base: 'gray.50', _dark: 'gray.900' }}
      px={{ base: 3, sm: 4 }}
      py={{ base: 2, sm: 2.5 }}
    >
      <form onSubmit={handleSubmit}>
        <Flex align="center" gap={2.5} px={1} mb={2.5}>
          {currentUser && (
            <Box className="shrink-0">
              <PostAvatar
                name={currentUser.name || currentUser.email || 'User'}
                image={currentUser.image}
                size={28}
              />
            </Box>
          )}
          <Flex
            minW={0}
            flex={1}
            align="center"
            gap={2}
            borderRadius="full"
            borderWidth="1px"
            borderColor={{ base: 'gray.300', _dark: 'whiteAlpha.300' }}
            bg={{ base: 'white', _dark: 'gray.700' }}
            pl={4}
            pr={2}
            h="36px"
            transition="all 0.2s"
            _focusWithin={{
              borderColor: 'green.500',
              boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.6)',
            }}
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('writeComment')}
              aria-label={t('writeComment')}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-400"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              aria-label={t('sendComment')}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                !newComment.trim()
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-green-600 hover:bg-green-50 active:scale-95 dark:text-green-400 dark:hover:bg-white/10'
              }`}
            >
              <Send size={18} />
            </button>
          </Flex>
        </Flex>
      </form>

      {isLoading && comments.length === 0 ? (
        <LoadingSpinner py={3} spinnerProps={{ size: 'sm' }} />
      ) : comments.length === 0 ? (
        <Box
          py={4}
          textAlign="center"
          fontSize="13px"
          color={{ base: 'gray.500', _dark: 'gray.400' }}
        >
          {t('noComments')}
        </Box>
      ) : (
        <Flex direction="column" gap={1.5} px={1}>
          {comments.map((comment) => (
            <Flex key={comment.id} className="group" gap={2} borderRadius="xl">
              <Link
                href={ROUTES.USER.PROFILE(comment.userId)}
                className="shrink-0 transition hover:opacity-90"
                aria-label={comment.user.name}
              >
                <PostAvatar
                  name={comment.user.name}
                  image={comment.user.image}
                  size={28}
                />
              </Link>
              <Box minW={0} flex={1}>
                <Box
                  w="full"
                  borderRadius="xl"
                  bg={{ base: 'gray.100', _dark: 'gray.700' }}
                  px={3}
                  py={1.5}
                >
                  <Box
                    fontSize="13px"
                    fontWeight="semibold"
                    color={{ base: 'gray.900', _dark: 'gray.50' }}
                  >
                    <Link
                      href={ROUTES.USER.PROFILE(comment.userId)}
                      className="hover:underline"
                    >
                      {comment.user.name}
                    </Link>
                  </Box>
                  <Box
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    fontSize="14px"
                    lineHeight="1.4"
                    color={{ base: 'gray.800', _dark: 'gray.100' }}
                  >
                    {comment.content}
                  </Box>
                </Box>
                <Flex
                  mt={0.5}
                  align="center"
                  gap={2}
                  pl={3}
                  fontSize="11px"
                  color={{ base: 'gray.500', _dark: 'gray.400' }}
                >
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                  {currentUserId === comment.userId && (
                    <button
                      onClick={() => setCommentIdToDelete(comment.id)}
                      aria-label={t('deleteComment')}
                      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 -ml-2 font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={12} />
                      {t('delete')}
                    </button>
                  )}
                </Flex>
              </Box>
            </Flex>
          ))}
        </Flex>
      )}

      {hasMore && (
        <button
          onClick={() => loadComments(page + 1)}
          disabled={isLoading}
          className="mt-4 w-full rounded-lg py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950/30"
        >
          {isLoading ? t('loading') : t('loadMoreComments')}
        </button>
      )}

      <VModal
        isOpen={commentIdToDelete !== null}
        onClose={() => setCommentIdToDelete(null)}
        title={t('deleteCommentConfirmTitle')}
        size="sm"
        primaryActionText={t('delete')}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isDeletingComment}
        isSecondaryDisabled={isDeletingComment}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('deleteCommentConfirmDescription')}
        </p>
      </VModal>
    </Box>
  );
}
