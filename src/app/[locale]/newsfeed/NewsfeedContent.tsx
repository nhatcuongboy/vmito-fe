'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import { Box, VStack, Text, Flex, Spinner } from '@chakra-ui/react';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { Button } from '@/components/ui/chakra-compat';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { PostCard } from '@/components/post/PostCard';
import { PostAvatar } from '@/components/post/PostAvatar';
import { NewsfeedSkeleton } from '@/components/post/PostCardSkeleton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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

  const refreshPosts = useCallback(async () => {
    await loadPosts(1);
  }, [loadPosts]);

  const handlePostDeleted = useCallback((postId: string) => {
    // Remove in place so the scroll position is preserved.
    setPosts((currentPosts) =>
      currentPosts.filter((p) => p.id !== postId && p.originalPostId !== postId)
    );
  }, []);

  const handlePostShared = useCallback((newPost: Post) => {
    // Prepend the freshly created repost without resetting the list.
    setPosts((currentPosts) => [newPost, ...currentPosts]);
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: () => loadPosts(page + 1, true),
  });

  return (
    <PageLayout title={navigationT('newsfeed')} maxW="container.md">
      <PullToRefresh onRefresh={refreshPosts}>
        <Box maxW="720px" mx="auto" w="full">
          <Box
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderWidth="1px"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.200' }}
            borderRadius="2xl"
            p={{ base: 3, md: 4 }}
            mb={4}
            boxShadow="sm"
          >
            <Flex align="center" gap={3}>
              <PostAvatar
                name={authorName}
                image={currentUser?.image}
                size={44}
              />
              <Box
                role="button"
                tabIndex={0}
                onClick={() => setIsCreateOpen(true)}
                display="flex"
                h={11}
                minW={0}
                flex={1}
                alignItems="center"
                borderRadius="full"
                bg="gray.100"
                _dark={{ bg: 'gray.700', _hover: { bg: 'gray.600' } }}
                pl={6}
                pr={4}
                textAlign="left"
                transition="all 0.2s"
                _hover={{ bg: 'gray.200' }}
                _focus={{ outline: 'none' }}
                _focusVisible={{
                  outline: 'none',
                  ring: 2,
                  ringColor: 'green.500',
                  ringOffset: 2,
                }}
                aria-label={t('createPost')}
                className="group"
              >
                <Text
                  as="span"
                  minW={0}
                  truncate
                  fontSize="md"
                  color="gray.500"
                  _dark={{
                    color: 'gray.300',
                    '.group:hover &': { color: 'white' },
                  }}
                  css={{
                    '.group:hover &': {
                      color: 'var(--chakra-colors-gray-600)',
                    },
                  }}
                  transition="color 0.2s"
                >
                  {t('composerPlaceholderWithName', { name: firstName })}
                </Text>
              </Box>
            </Flex>
          </Box>

          {isLoading ? (
            <NewsfeedSkeleton />
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
            <VStack gap={5} align="stretch">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onPostUpdate={refreshPosts}
                  onPostDeleted={handlePostDeleted}
                  onPostShared={handlePostShared}
                />
              ))}

              {/* Infinite scroll sentinel */}
              {hasMore && !hasError && (
                <Flex ref={sentinelRef} justify="center" py={3}>
                  {isLoadingMore && <Spinner size="sm" color="green.500" />}
                </Flex>
              )}

              {/* Manual retry fallback when loading the next page failed */}
              {hasMore && hasError && (
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
      </PullToRefresh>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={refreshPosts}
      />
    </PageLayout>
  );
}
