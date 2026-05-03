'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { postsService } from '@/lib/api/posts.service';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Post } from '@/types/post';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { HStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function NewsfeedContent() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPosts = async (pageNum = 1, append = false) => {
    setIsLoading(true);
    try {
      const response = await postsService.getPosts(pageNum);
      if (append) {
        setPosts((prev) => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  const handlePostCreated = () => {
    loadPosts(1, false);
  };

  const handlePostUpdate = () => {
    loadPosts(1, false);
  };

  return (
    <PageLayout title={t('navigation.newsfeed')}>
      <HStack justify="flex-end" mb={6}>
        <Button
          size="sm"
          colorPalette="green"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          {t('posts.createPost')}
        </Button>
      </HStack>

      {(!posts || posts.length === 0) && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">{t('posts.noPosts')}</p>
          <p className="text-sm">{t('posts.beFirstToShare')}</p>
        </div>
      )}

      <div>
        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onPostUpdate={handlePostUpdate}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('common.loadMore')}
        </button>
      )}

      {isLoading && (!posts || posts.length === 0) && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </PageLayout>
  );
}
