'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Send, Trash2 } from 'lucide-react';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import type { PostComment } from '@/types/post';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { PostAvatar } from './PostAvatar';

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
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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

  const handleDelete = async (commentId: string) => {
    try {
      await postsService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
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
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/5">
      <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('writeComment')}
          aria-label={t('writeComment')}
          className="h-10 flex-1 rounded-full bg-gray-100 px-4 text-sm text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          aria-label={t('sendComment')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 active:scale-[0.95] disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>

      {isLoading && comments.length === 0 ? (
        <LoadingSpinner py={4} spinnerProps={{ size: 'md' }} />
      ) : comments.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-3">
          {t('noComments')}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <PostAvatar
                name={comment.user.name}
                image={comment.user.image}
                size={32}
              />
              <div className="flex-1">
                <div className="inline-block rounded-2xl bg-gray-100 px-3.5 py-2 dark:bg-gray-700">
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-50">
                    {comment.user.name}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">
                    {comment.content}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-3 pl-2 text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {currentUserId === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      aria-label={t('deleteComment')}
                      className="flex items-center gap-1 text-red-500 transition hover:text-red-700"
                    >
                      <Trash2 size={12} />
                      {t('delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => loadComments(page + 1)}
          disabled={isLoading}
          className="w-full mt-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded"
        >
          {isLoading ? t('loading') : t('loadMoreComments')}
        </button>
      )}
    </div>
  );
}
