'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import { Box, VStack, Text } from '@chakra-ui/react';
import AppEmptyState from '@/components/ui/AppEmptyState';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/chakra-compat';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { PostCard } from '@/components/post/PostCard';
import { PostAvatar } from '@/components/post/PostAvatar';
import { postsService } from '@/lib/api/posts.service';
import type { Post } from '@/types/post';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';

const POSTS_PER_PAGE = 10;

export default function NewsfeedContent() {
  const t = useTranslations('posts');
  const navigationT = useTranslations('navigation');
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const authorName = currentUser?.name || currentUser?.email || 'User';
  const firstName = authorName.split(' ')[0] || authorName;

  const loadPosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      try {
        const response = await postsService.getPosts(pageNum, POSTS_PER_PAGE);
        const responsePosts = Array.isArray(response.posts)
          ? response.posts
          : [];

        setPosts((currentPosts) => {
          if (!append) return responsePosts;

          const existingIds = new Set(currentPosts.map((post) => post.id));
          const nextPosts = responsePosts.filter(
            (post) => !existingIds.has(post.id)
          );
          return [...currentPosts, ...nextPosts];
        });
        setPage(response.page ?? pageNum);
        setHasMore(Boolean(response.hasMore));
      } catch {
        setHasError(true);
        toaster.create({
          title: t('error'),
          description: t('loadPostsError'),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const refreshPosts = useCallback(() => {
    loadPosts(1);
  }, [loadPosts]);

  return (
    <PageLayout title={navigationT('newsfeed')} maxW="container.md">
      <Box maxW="720px" mx="auto" w="full">
        <Box
          bg={{ base: 'white', _dark: 'gray.800' }}
          borderWidth="1px"
          borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.200' }}
          borderRadius="xl"
          p={{ base: 3, md: 4 }}
          mb={4}
          boxShadow="sm"
        >
          <div className="flex items-center gap-3">
            <PostAvatar
              name={authorName}
              image={currentUser?.image}
              size={44}
            />
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="group flex h-11 min-w-0 flex-1 items-center rounded-full bg-gray-100 pl-6 pr-4 text-left transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600"
              aria-label={t('createPost')}
            >
              <span className="min-w-0 truncate text-base text-gray-500 transition group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-white">
                {t('composerPlaceholderWithName', { name: firstName })}
              </span>
            </button>
          </div>
        </Box>

        {isLoading ? (
          <LoadingSpinner minH="40vh" />
        ) : hasError && posts.length === 0 ? (
          <AppEmptyState
            title={t('loadPostsError')}
            description={t('retryDescription')}
            actions={
              <Button
                onClick={refreshPosts}
                leftIcon={<RefreshCcw size={16} />}
              >
                {t('retry')}
              </Button>
            }
          />
        ) : posts.length === 0 ? (
          <AppEmptyState
            title={t('noPosts')}
            description={t('beFirstToShare')}
            actions={
              <Button
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus size={16} />}
              >
                {t('createPost')}
              </Button>
            }
          />
        ) : (
          <VStack gap={4} align="stretch">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onPostUpdate={refreshPosts}
              />
            ))}

            {hasMore && (
              <Button
                variant="ghost"
                colorPalette="green"
                borderRadius="full"
                onClick={() => loadPosts(page + 1, true)}
                loading={isLoadingMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? t('loading') : t('loadMore')}
              </Button>
            )}
          </VStack>
        )}

        {!isLoading && hasError && posts.length > 0 && (
          <Text textAlign="center" mt={4} color="red.500" fontSize="sm">
            {t('loadMoreError')}
          </Text>
        )}
      </Box>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={refreshPosts}
      />
    </PageLayout>
  );
}
