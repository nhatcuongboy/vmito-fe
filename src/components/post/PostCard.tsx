'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
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

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  currentUserId?: string;
}

export function PostCard({ post, onPostUpdate, currentUserId }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const isOwner = currentUserId === localPost.authorId;

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
        title: 'Error',
        description: 'Failed to like post',
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      await postsService.sharePost(localPost.id);
      toaster.create({
        title: 'Success',
        description: 'Post shared successfully',
        type: 'success',
      });
      onPostUpdate?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error',
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to share post',
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await postsService.deletePost(localPost.id);
      toaster.create({
        title: 'Success',
        description: 'Post deleted successfully',
        type: 'success',
      });
      onPostUpdate?.();
    } catch {
      toaster.create({
        title: 'Error',
        description: 'Failed to delete post',
        type: 'error',
      });
    }
  };

  const extractHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('#') ? (
        <span key={i} className="text-blue-500 hover:underline cursor-pointer">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
      )?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      {/* Shared post indicator */}
      {localPost.originalPost && (
        <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
          <Share2 size={14} />
          Shared from {localPost.originalPost.author.name}
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
              className="p-2 hover:bg-gray-100 rounded"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg py-2 z-10">
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                >
                  Delete
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
          {localPost.images.map((img) => (
            <img // eslint-disable-line @next/next/no-img-element
              key={img.id}
              src={img.url}
              alt=""
              className="w-full rounded-lg object-cover max-h-96"
            />
          ))}
        </div>
      )}

      {/* Video */}
      {localPost.videoUrl && getVideoEmbedUrl(localPost.videoUrl) && (
        <div className="mb-3">
          <iframe
            src={getVideoEmbedUrl(localPost.videoUrl)!}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
          />
        </div>
      )}

      {/* Location */}
      {localPost.location && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPin size={14} />
          {localPost.location.name}
        </div>
      )}

      {/* Original post (for shares) */}
      {localPost.originalPost && (
        <div className="border rounded-lg p-3 mb-3 bg-gray-50">
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
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 ${
            localPost.isLiked ? 'text-red-500' : ''
          }`}
        >
          <Heart size={20} fill={localPost.isLiked ? 'currentColor' : 'none'} />
          <span>{localPost._count.likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
        >
          <MessageCircle size={20} />
          <span>{localPost._count.comments}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
        >
          <Share2 size={20} />
          <span>{localPost._count.shares}</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection postId={localPost.id} currentUserId={currentUserId} />
      )}
    </div>
  );
}
