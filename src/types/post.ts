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

export type PostType = 'USER' | 'ACTIVITY';
export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type ActivityType =
  | 'SESSION_CREATED'
  | 'SESSION_RESULTS'
  | 'CLUB_CREATED'
  | 'CLUB_UPDATED'
  | 'CLUB_MEMBER_JOINED'
  | 'TOURNAMENT_CREATED'
  | 'TOURNAMENT_FINISHED'
  | 'AVATAR_UPDATED'
  | 'USER_RATED';

// Mirrors vmito-be/src/activities/activity-metadata.types.ts
export interface SessionResultsStanding {
  rank: number;
  playerNumber: number;
  name: string;
  matchesPlayed: number;
  wins?: number;
  winRate?: number;
  totalWaitTime: number;
  userId?: string | null;
  image?: string | null;
}

export interface TournamentPodiumSide {
  players: Array<{ name: string; userId?: string | null }>;
}

export interface TournamentFinishedCategory {
  categoryId: string;
  categoryName: string;
  champion: TournamentPodiumSide;
  runnerUp?: TournamentPodiumSide | null;
}

export interface ActivityMetadata {
  // SESSION_CREATED / SESSION_RESULTS
  sessionId?: string;
  sessionSlug?: string | null;
  sessionName?: string;
  coverPhoto?: string | null;
  scheduledStartTime?: string | null;
  endTime?: string | null;
  standings?: SessionResultsStanding[];
  location?: string | null;
  // CLUB_*
  clubId?: string;
  clubSlug?: string | null;
  clubName?: string;
  logo?: string | null;
  // TOURNAMENT_*
  tournamentId?: string;
  tournamentSlug?: string | null;
  tournamentName?: string;
  startDate?: string | null;
  venueName?: string | null;
  categories?: TournamentFinishedCategory[];
  // AVATAR_UPDATED
  image?: string;
  // USER_RATED
  ratedUserId?: string;
  ratedName?: string;
  ratedImage?: string | null;
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
  type?: PostType;
  activityType?: ActivityType | null;
  metadata?: ActivityMetadata | null;
  visibility?: PostVisibility;
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
  images?: Array<{
    url: string;
    publicId: string;
    order?: number;
  }>;
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
