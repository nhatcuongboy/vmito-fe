export interface PostImage {
  id: string;
  url: string;
  publicId: string;
  order: number;
}

export interface PostAuthor {
  id: string;
  name: string;
  image?: string;
}

export interface Post {
  id: string;
  content: string;
  videoUrl?: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  };
  authorId: string;
  author: PostAuthor;
  images: PostImage[];
  originalPostId?: string;
  originalPost?: Post;
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  user: PostAuthor;
  content: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  videoUrl?: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CommentsResponse {
  comments: PostComment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
