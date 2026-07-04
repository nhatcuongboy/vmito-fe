'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Box } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import AppEmptyState from '@/components/ui/AppEmptyState';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/chakra-compat';
import { PostCard } from '@/components/post/PostCard';
import { postsService } from '@/lib/api/posts.service';
import type { Post } from '@/types/post';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter, Link } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';

export default function PostDetailContent() {
  const t = useTranslations('posts');
  const navigationT = useTranslations('navigation');
  const params = useParams();
  const router = useRouter();
  const postId = typeof params.postId === 'string' ? params.postId : '';
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await postsService.getPost(postId);
      setPost(response);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handlePostUpdate = useCallback(async () => {
    try {
      const response = await postsService.getPost(postId);
      setPost(response);
    } catch {
      // Post no longer exists (e.g. owner deleted it) — return to the feed
      router.replace(ROUTES.NEWSFEED);
    }
  }, [postId, router]);

  return (
    <PageLayout title={navigationT('newsfeed')} maxW="container.md">
      <Box maxW="720px" mx="auto" w="full">
        <Box mb={4}>
          <Link
            href={ROUTES.NEWSFEED}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft size={16} />
            {t('backToFeed')}
          </Link>
        </Box>

        {isLoading ? (
          <LoadingSpinner minH="40vh" />
        ) : hasError || !post ? (
          <AppEmptyState
            title={t('postNotFound')}
            description={t('postNotFoundDescription')}
            actions={
              <Button onClick={() => router.push(ROUTES.NEWSFEED)}>
                {t('backToFeed')}
              </Button>
            }
          />
        ) : (
          <PostCard
            post={post}
            currentUserId={currentUserId}
            onPostUpdate={handlePostUpdate}
            defaultShowComments
          />
        )}
      </Box>
    </PageLayout>
  );
}
