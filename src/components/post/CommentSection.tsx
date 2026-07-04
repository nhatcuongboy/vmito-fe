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
    <div className="border-t border-gray-200 bg-gray-50/60 px-4 py-4 dark:border-white/10 dark:bg-white/[0.02] sm:px-5">
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex items-center gap-2.5">
          {currentUser && (
            <PostAvatar
              name={currentUser.name || currentUser.email || 'User'}
              image={currentUser.image}
              size={32}
              className="shrink-0"
            />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white pl-4 pr-2 shadow-sm ring-1 ring-gray-200 transition focus-within:ring-2 focus-within:ring-green-500/60 dark:bg-gray-700 dark:ring-white/10">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('writeComment')}
              aria-label={t('writeComment')}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-400"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              aria-label={t('sendComment')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-green-600 transition hover:bg-green-100 disabled:text-gray-400 disabled:hover:bg-transparent dark:text-green-400 dark:hover:bg-green-950/40 dark:disabled:text-gray-500"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>

      {isLoading && comments.length === 0 ? (
        <LoadingSpinner py={4} spinnerProps={{ size: 'md' }} />
      ) : comments.length === 0 ? (
        <div className="py-3 text-center text-[13px] text-gray-500 dark:text-gray-400">
          {t('noComments')}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-2.5">
              <PostAvatar
                name={comment.user.name}
                image={comment.user.image}
                size={32}
                className="ring-2 ring-white dark:ring-gray-800"
              />
              <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-700 dark:ring-white/5">
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-50">
                    {comment.user.name}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-sm leading-snug text-gray-800 dark:text-gray-100">
                    {comment.content}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3 pl-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                  {currentUserId === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      aria-label={t('deleteComment')}
                      className="flex items-center gap-1 font-medium text-red-500 transition hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
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
          className="mt-4 w-full rounded-lg py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950/30"
        >
          {isLoading ? t('loading') : t('loadMoreComments')}
        </button>
      )}
    </div>
  );
}
