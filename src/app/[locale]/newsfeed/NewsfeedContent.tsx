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
import { UserPreviewHoverCard } from '@/components/preview-cards/UserPreviewHoverCard';
import { NewsfeedSkeleton } from '@/components/post/PostCardSkeleton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { Post } from '@/types/post';
import { useAuthStore } from '@/stores/useAuthStore';
import NewsfeedDiscoveryRail from '@/components/newsfeed/NewsfeedDiscoveryRail';
import { useNewsfeedStore } from '@/stores/useNewsfeedStore';
import { useNewsfeedBadgeStore } from '@/stores/useNewsfeedBadgeStore';
import { UserRole } from '@/lib/api/types';

export default function NewsfeedContent() {
  const t = useTranslations('posts');
  const navigationT = useTranslations('navigation');
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const ownerUserId = useNewsfeedStore((state) => state.ownerUserId);
  const posts = useNewsfeedStore((state) => state.posts);
  const hasMore = useNewsfeedStore((state) => state.hasMore);
  const isLoading = useNewsfeedStore((state) => state.isLoading);
  const isRefreshing = useNewsfeedStore((state) => state.isRefreshing);
  const isLoadingMore = useNewsfeedStore((state) => state.isLoadingMore);
  const hasError = useNewsfeedStore((state) => state.hasError);
  const ensureFeed = useNewsfeedStore((state) => state.ensureFeed);
  const refreshFeed = useNewsfeedStore((state) => state.refreshFeed);
  const markNewsfeedAsRead = useNewsfeedBadgeStore((state) => state.markAsRead);
  const loadMore = useNewsfeedStore((state) => state.loadMore);
  const removePost = useNewsfeedStore((state) => state.removePost);
  const prependPost = useNewsfeedStore((state) => state.prependPost);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasDiscoveryContent, setHasDiscoveryContent] = useState<
    boolean | null
  >(null);
  const authorName = currentUser?.name || currentUser?.email || 'User';
  const firstName = authorName.split(' ')[0] || authorName;
  const showInitialSkeleton = isLoading || ownerUserId !== currentUserId;

  useEffect(() => {
    if (currentUserId) void ensureFeed(currentUserId);
  }, [currentUserId, ensureFeed]);

  const refreshPosts = useCallback(async () => {
    if (!currentUserId) return;

    const refreshed = await refreshFeed(currentUserId);
    if (refreshed && currentUser?.role !== UserRole.GUEST) {
      void markNewsfeedAsRead();
    }
  }, [currentUser?.role, currentUserId, refreshFeed, markNewsfeedAsRead]);

  const retryPosts = refreshPosts;

  const handlePostDeleted = useCallback(
    (postId: string) => {
      if (currentUserId) removePost(currentUserId, postId);
    },
    [currentUserId, removePost]
  );

  const handlePostShared = useCallback(
    (newPost: Post) => {
      if (currentUserId) prependPost(currentUserId, newPost);
    },
    [currentUserId, prependPost]
  );

  const handleDiscoveryAvailability = useCallback((hasContent: boolean) => {
    setHasDiscoveryContent(hasContent);
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: showInitialSkeleton || isRefreshing || isLoadingMore,
    onLoadMore: () => {
      if (currentUserId) void loadMore(currentUserId);
    },
  });

  return (
    <PageLayout title={navigationT('newsfeed')} maxW="1112px">
      <PullToRefresh onRefresh={refreshPosts}>
        <div
          data-slot="newsfeed-discovery-layout"
          className={`mx-auto w-full max-w-[720px] ${
            hasDiscoveryContent === false
              ? ''
              : 'min-[1440px]:grid min-[1440px]:max-w-[1064px] min-[1440px]:grid-cols-[minmax(0,720px)_320px] min-[1440px]:items-start min-[1440px]:gap-6'
          }`}
        >
          <Box data-slot="newsfeed-feed-column" minW={0} maxW="720px" w="full">
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
                <UserPreviewHoverCard userId={currentUser?.id}>
                  <span className="inline-flex">
                    <PostAvatar
                      name={authorName}
                      image={currentUser?.image}
                      size={44}
                      bordered
                    />
                  </span>
                </UserPreviewHoverCard>
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

            {showInitialSkeleton ? (
              <NewsfeedSkeleton />
            ) : hasError && posts.length === 0 ? (
              <AppEmptyState
                title={t('loadPostsError')}
                description={t('retryDescription')}
                actions={
                  <Button
                    onClick={retryPosts}
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
                {isRefreshing && (
                  <Flex justify="center" py={1} aria-label={t('loading')}>
                    <Spinner size="sm" color="green.500" />
                  </Flex>
                )}
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
                    onClick={() => currentUserId && loadMore(currentUserId)}
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

          <aside
            data-slot="newsfeed-discovery-rail"
            aria-label={t('discoveryRail.ariaLabel')}
            className={`${
              hasDiscoveryContent === false
                ? 'hidden'
                : 'hidden min-[1440px]:block'
            } sticky top-[72px] self-start`}
          >
            <NewsfeedDiscoveryRail
              onAvailabilityChange={handleDiscoveryAvailability}
            />
          </aside>
        </div>
      </PullToRefresh>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={refreshPosts}
      />
    </PageLayout>
  );
}
