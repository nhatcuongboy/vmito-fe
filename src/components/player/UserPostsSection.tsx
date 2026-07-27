'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, VStack, Text, Flex, Spinner, Icon } from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PostCard } from '@/components/post/PostCard';
import { NewsfeedSkeleton } from '@/components/post/PostCardSkeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { postsService } from '@/lib/api/posts.service';
import type { Post } from '@/types/post';
import { useAuthStore } from '@/stores/useAuthStore';

const POSTS_PER_PAGE = 10;

interface UserPostsSectionProps {
  userId: string;
}

export default function UserPostsSection({ userId }: UserPostsSectionProps) {
  const t = useTranslations('userProfilePage');
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await postsService.getUserPosts(
          userId,
          pageNum,
          POSTS_PER_PAGE
        );
        const responsePosts = Array.isArray(response.posts)
          ? response.posts
          : [];

        setPosts((currentPosts) => {
          if (!append) return responsePosts;
          const existingIds = new Set(currentPosts.map((post) => post.id));
          return [
            ...currentPosts,
            ...responsePosts.filter((post) => !existingIds.has(post.id)),
          ];
        });
        setPage(response.page ?? pageNum);
        setHasMore(Boolean(response.hasMore));
      } catch (error) {
        console.error('Failed to load user posts:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((p) => p.id !== postId && p.originalPostId !== postId)
    );
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: () => loadPosts(page + 1, true),
  });

  if (isLoading) {
    return <NewsfeedSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="gray.300"
        borderRadius="xl"
        p={6}
        textAlign="center"
        bg="gray.50"
        _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
      >
        <Icon as={FileText} boxSize={6} color="gray.300" mb={2} />
        <Text color="gray.500" _dark={{ color: 'gray.400' }}>
          {t('noPosts')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onPostDeleted={handlePostDeleted}
        />
      ))}

      <Box ref={sentinelRef} h="1px" />

      {isLoadingMore && (
        <Flex justify="center" py={4}>
          <Spinner size="md" color="green.500" />
        </Flex>
      )}
    </VStack>
  );
}
