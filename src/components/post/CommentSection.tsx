'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Send, Trash2 } from 'lucide-react';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import type { PostComment } from '@/types/post';
import LoadingSpinner from '@/components/ui/loading-spinner';

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
    <div className="border-t pt-4 mt-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('writeComment')}
          aria-label={t('writeComment')}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 dark:bg-gray-800 dark:border-white/10"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          aria-label={t('sendComment')}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Send size={20} />
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
            <div key={comment.id} className="flex gap-3">
              <Image
                src={comment.user.image || '/default-avatar.png'}
                alt={comment.user.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="font-semibold text-sm">
                    {comment.user.name}
                  </div>
                  <div className="text-sm">{comment.content}</div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {currentUserId === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      aria-label={t('deleteComment')}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1"
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
