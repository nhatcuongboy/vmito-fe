'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import type { Post } from '@/types/post';
import { CommentSection } from './CommentSection';
import { PostAvatar } from './PostAvatar';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import VModal from '@/components/ui/VModal';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  currentUserId?: string;
}

export function PostCard({ post, onPostUpdate, currentUserId }: PostCardProps) {
  const t = useTranslations('posts');
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUserId === localPost.authorId;
  const postImages = localPost.images ?? [];
  const postCounts = localPost._count ?? { likes: 0, comments: 0, shares: 0 };
  const hasEngagement =
    postCounts.likes > 0 || postCounts.comments > 0 || postCounts.shares > 0;
  const headerGridClassName = isOwner
    ? 'grid-cols-[48px_minmax(0,1fr)_36px]'
    : 'grid-cols-[48px_minmax(0,1fr)]';

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCommentCountChange = useCallback((nextCount: number) => {
    setLocalPost((prev) => {
      const prevCounts = prev._count ?? { likes: 0, comments: 0, shares: 0 };

      return {
        ...prev,
        _count: { ...prevCounts, comments: nextCount },
      };
    });
  }, []);

  const handleLike = async () => {
    try {
      const result = await postsService.toggleLike(localPost.id);
      setLocalPost((prev) => {
        const prevCounts = prev._count ?? { likes: 0, comments: 0, shares: 0 };

        return {
          ...prev,
          isLiked: result.liked,
          _count: { ...prevCounts, likes: result.likeCount },
        };
      });
    } catch {
      toaster.create({
        title: t('error'),
        description: t('likeError'),
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      await postsService.sharePost(localPost.id);
      toaster.create({
        title: t('success'),
        description: t('shareSuccess'),
        type: 'success',
      });
      onPostUpdate?.();
    } catch (error: unknown) {
      toaster.create({
        title: t('error'),
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || t('shareError'),
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postsService.deletePost(localPost.id);
      toaster.create({
        title: t('success'),
        description: t('deleteSuccess'),
        type: 'success',
      });
      setShowDeleteConfirm(false);
      onPostUpdate?.();
    } catch {
      toaster.create({
        title: t('error'),
        description: t('deleteError'),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const extractHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('#') ? (
        <span
          key={i}
          className="cursor-pointer font-medium text-green-600 hover:underline"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getImageClassName = (index: number) => {
    if (postImages.length === 1) {
      return 'max-h-[520px] w-full object-cover';
    }

    if (postImages.length === 3 && index === 0) {
      return 'h-full min-h-[260px] w-full object-cover sm:row-span-2';
    }

    return 'aspect-square w-full object-cover';
  };

  return (
    <article className="isolate overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-gray-800">
      {/* Shared post indicator */}
      {localPost.originalPost && (
        <div className="mx-4 mt-4 mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
          <Share2 size={14} className="shrink-0 text-green-600" />
          <span className="truncate">
            {t('sharedFrom', { name: localPost.originalPost.author.name })}
          </span>
        </div>
      )}

      <div className="bg-white px-4 pt-4 pb-3 dark:bg-gray-800">
        {/* Header */}
        <div className={`grid ${headerGridClassName} items-start gap-x-3`}>
          <PostAvatar
            name={localPost.author.name}
            image={localPost.author.image}
            size={48}
            className="ring-2 ring-white shadow-sm dark:ring-gray-800"
          />
          <div className="min-w-0 pt-0.5">
            <div className="truncate text-[15px] font-semibold leading-5 text-gray-950 dark:text-gray-50">
              {localPost.author.name}
            </div>
            <time
              className="mt-1 block text-[13px] leading-4 text-gray-500 dark:text-gray-400"
              dateTime={localPost.createdAt}
            >
              {formatDistanceToNow(new Date(localPost.createdAt), {
                addSuffix: true,
              })}
            </time>
          </div>
          {isOwner && (
            <div className="relative justify-self-end" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                aria-label={t('postMenu')}
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 z-10 mt-2 min-w-[150px] origin-top-right animate-[fadeIn_0.12s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-gray-800">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} />
                    {t('delete')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-gray-800 dark:text-gray-100">
          {extractHashtags(localPost.content)}
        </div>
      </div>

      {/* Images */}
      {postImages.length > 0 && (
        <div
          className={`mx-4 mb-4 grid overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-gray-900 ${
            postImages.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-2 gap-0.5 sm:auto-rows-fr'
          }`}
        >
          {postImages.map((img, index) => (
            <img // eslint-disable-line @next/next/no-img-element
              key={img.id}
              src={img.url}
              alt={t('postImage', { index: index + 1 })}
              loading="lazy"
              className={getImageClassName(index)}
            />
          ))}
        </div>
      )}

      {/* Location */}
      {localPost.location && (
        <div className="mx-4 mb-4 bg-white dark:bg-gray-800">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{localPost.location.name}</span>
          </div>
        </div>
      )}

      {/* Original post (for shares) */}
      {localPost.originalPost && (
        <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-gray-700/50">
          <div className="mb-2 flex items-center gap-2">
            <PostAvatar
              name={localPost.originalPost.author.name}
              image={localPost.originalPost.author.image}
              size={32}
              className="ring-1 ring-white dark:ring-gray-700"
            />
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-gray-50">
              {localPost.originalPost.author.name}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-gray-200">
            {localPost.originalPost.content}
          </div>
        </div>
      )}

      {hasEngagement && (
        <div className="mx-4 flex items-center justify-between border-t border-gray-100 bg-white py-2.5 text-xs font-medium text-gray-500 dark:border-white/5 dark:bg-gray-800 dark:text-gray-400">
          <div>
            {postCounts.likes > 0 && (
              <span>
                {postCounts.likes} {t('like')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {postCounts.comments > 0 && (
              <span>
                {postCounts.comments} {t('comment')}
              </span>
            )}
            {postCounts.shares > 0 && (
              <span>
                {postCounts.shares} {t('share')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            aria-label={localPost.isLiked ? t('unlikePost') : t('likePost')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-sm font-semibold transition hover:bg-white hover:shadow-sm active:scale-[0.98] dark:hover:bg-gray-700 sm:px-3 ${
              localPost.isLiked
                ? 'bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/20 dark:ring-red-900/40'
                : 'text-slate-600 dark:text-gray-300'
            }`}
          >
            <Heart
              size={19}
              className="mr-1.5 shrink-0"
              fill={localPost.isLiked ? 'currentColor' : 'none'}
            />
            <span className="truncate">{t('like')}</span>
            {postCounts.likes > 0 && (
              <span className="rounded-full bg-white/80 px-1.5 text-[11px] leading-5 text-current ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                {postCounts.likes}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            aria-label={t('toggleComments')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-sm font-semibold transition hover:bg-white hover:shadow-sm active:scale-[0.98] dark:hover:bg-gray-700 sm:px-3 ${
              showComments
                ? 'bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-green-950/20 dark:text-green-300 dark:ring-green-900/40'
                : 'text-slate-600 dark:text-gray-300'
            }`}
          >
            <MessageCircle size={19} className="mr-1.5 shrink-0" />
            <span className="truncate">{t('comment')}</span>
            {postCounts.comments > 0 && (
              <span className="rounded-full bg-white/80 px-1.5 text-[11px] leading-5 text-current ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                {postCounts.comments}
              </span>
            )}
          </button>
          <button
            onClick={handleShare}
            aria-label={t('sharePost')}
            className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:shadow-sm active:scale-[0.98] dark:text-gray-300 dark:hover:bg-gray-700 sm:px-3"
          >
            <Share2 size={19} className="mr-1.5 shrink-0" />
            <span className="truncate">{t('share')}</span>
            {postCounts.shares > 0 && (
              <span className="rounded-full bg-white/80 px-1.5 text-[11px] leading-5 text-current ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                {postCounts.shares}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          postId={localPost.id}
          currentUserId={currentUserId}
          initialCommentCount={postCounts.comments}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      <VModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('deleteConfirmTitle')}
        size="sm"
        primaryActionText={t('delete')}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isDeleting}
        isSecondaryDisabled={isDeleting}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('deleteConfirmDescription')}
        </p>
      </VModal>
    </article>
  );
}
