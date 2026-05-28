'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import type { Post } from '@/types/post';
import { CommentSection } from './CommentSection';
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
  const isOwner = currentUserId === localPost.authorId;

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const handleCommentCountChange = useCallback((nextCount: number) => {
    setLocalPost((prev) => ({
      ...prev,
      _count: { ...prev._count, comments: nextCount },
    }));
  }, []);

  const handleLike = async () => {
    try {
      const result = await postsService.toggleLike(localPost.id);
      setLocalPost((prev) => ({
        ...prev,
        isLiked: result.liked,
        _count: { ...prev._count, likes: result.likeCount },
      }));
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
        <span key={i} className="text-green-600 hover:underline cursor-pointer">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4">
      {/* Shared post indicator */}
      {localPost.originalPost && (
        <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
          <Share2 size={14} />
          {t('sharedFrom', { name: localPost.originalPost.author.name })}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Image
            src={localPost.author.image || '/default-avatar.png'}
            alt={localPost.author.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-semibold">{localPost.author.name}</div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(localPost.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label={t('postMenu')}
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10 border border-gray-100 dark:border-white/10">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                >
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3 whitespace-pre-wrap">
        {extractHashtags(localPost.content)}
      </div>

      {/* Images */}
      {localPost.images.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${localPost.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          {localPost.images.map((img, index) => (
            <img // eslint-disable-line @next/next/no-img-element
              key={img.id}
              src={img.url}
              alt={t('postImage', { index: index + 1 })}
              loading="lazy"
              className="w-full rounded-lg object-cover max-h-96"
            />
          ))}
        </div>
      )}

      {/* Location */}
      {localPost.location && (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <MapPin size={14} />
          {localPost.location.name}
        </div>
      )}

      {/* Original post (for shares) */}
      {localPost.originalPost && (
        <div className="border rounded-lg p-3 mb-3 bg-gray-50 dark:bg-gray-700/50 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Image
              src={localPost.originalPost.author.image || '/default-avatar.png'}
              alt={localPost.originalPost.author.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold text-sm">
              {localPost.originalPost.author.name}
            </span>
          </div>
          <div className="text-sm">{localPost.originalPost.content}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <button
          onClick={handleLike}
          aria-label={localPost.isLiked ? t('unlikePost') : t('likePost')}
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
            localPost.isLiked ? 'text-red-500' : ''
          }`}
        >
          <Heart size={20} fill={localPost.isLiked ? 'currentColor' : 'none'} />
          <span>{localPost._count.likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          aria-label={t('toggleComments')}
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MessageCircle size={20} />
          <span>{localPost._count.comments}</span>
        </button>
        <button
          onClick={handleShare}
          aria-label={t('sharePost')}
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Share2 size={20} />
          <span>{localPost._count.shares}</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          postId={localPost.id}
          currentUserId={currentUserId}
          initialCommentCount={localPost._count.comments}
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
    </div>
  );
}
