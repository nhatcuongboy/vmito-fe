'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2 } from 'lucide-react';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';
import type { PostComment } from '@/types/post';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
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
        if (pageNum === 1) {
          setComments(response.comments);
        } else {
          setComments((prev) => [...prev, ...response.comments]);
        }
        setHasMore(response.hasMore);
        setPage(pageNum);
      } catch {
        toaster.create({
          title: 'Error',
          description: 'Failed to load comments',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    loadComments();
  }, [postId, loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await postsService.createComment(postId, newComment);
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      toaster.create({
        title: 'Success',
        description: 'Comment added',
        type: 'success',
      });
    } catch {
      toaster.create({
        title: 'Error',
        description: 'Failed to add comment',
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
      toaster.create({
        title: 'Success',
        description: 'Comment deleted',
        type: 'success',
      });
    } catch {
      toaster.create({
        title: 'Error',
        description: 'Failed to delete comment',
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
          placeholder="Write a comment..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>

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
                <div className="font-semibold text-sm">{comment.user.name}</div>
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
                    className="text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => loadComments(page + 1)}
          disabled={isLoading}
          className="w-full mt-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
        >
          {isLoading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
