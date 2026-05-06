import { api } from './base';
import type {
  Post,
  PostsResponse,
  CreatePostData,
  PostComment,
  CommentsResponse,
} from '@/types/post';

export const postsService = {
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await api.post('/posts', data);
    return response.data;
  },

  async getPosts(page = 1, limit = 10): Promise<PostsResponse> {
    const response = await api.get('/posts/feed', { params: { page, limit } });
    return response.data;
  },

  async getPost(id: string): Promise<Post> {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async updatePost(id: string, data: Partial<CreatePostData>): Promise<Post> {
    const response = await api.patch(`/posts/${id}`, data);
    return response.data;
  },

  async deletePost(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async uploadImages(
    postId: string,
    files: File[]
  ): Promise<{
    images: Array<{ url: string; publicId: string; order: number }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post(`/posts/${postId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async toggleLike(
    postId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  async createComment(postId: string, content: string): Promise<PostComment> {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  async getComments(
    postId: string,
    page = 1,
    limit = 20
  ): Promise<CommentsResponse> {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/posts/comments/${commentId}`);
    return response.data;
  },

  async sharePost(postId: string): Promise<Post> {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data;
  },
};
