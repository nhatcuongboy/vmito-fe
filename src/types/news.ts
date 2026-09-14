import { Locale } from '@/i18n/locales';

export enum EArticleCategory {
  NEWS = 'NEWS',
  TUTORIAL = 'TUTORIAL',
  TOURNAMENT = 'TOURNAMENT',
  EQUIPMENT = 'EQUIPMENT',
  COMMUNITY = 'COMMUNITY',
}

export const ARTICLE_CATEGORIES = [
  EArticleCategory.NEWS,
  EArticleCategory.TUTORIAL,
  EArticleCategory.TOURNAMENT,
  EArticleCategory.EQUIPMENT,
  EArticleCategory.COMMUNITY,
] as const;

export enum EArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface IArticleAuthor {
  id: string;
  name: string;
  image?: string | null;
}

/** Card payload returned by list endpoints — no `content`. */
export interface IArticleSummary {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: EArticleCategory;
  tags: string[];
  status: EArticleStatus;
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  author: IArticleAuthor | null;
}

/** The same article across the locales it has been translated into. */
export interface IArticleTranslation {
  locale: Locale;
  slug: string;
}

export interface IArticle extends IArticleSummary {
  content: string;
  translationGroupId: string | null;
  createdAt: string;
  translations: IArticleTranslation[];
}

/** Adds the fields only an editor needs. */
export interface IAdminArticle extends IArticle {
  coverImagePublicId: string | null;
  authorId: string | null;
}

export interface IArticlePage<T = IArticleSummary> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IArticleSitemapEntry {
  slug: string;
  locale: Locale;
  updatedAt: string;
  publishedAt: string | null;
}

export interface IArticleCategoryCount {
  category: EArticleCategory;
  count: number;
}

export interface IQueryArticlesParams {
  page?: number;
  limit?: number;
  locale?: Locale;
  category?: EArticleCategory;
  tag?: string;
  search?: string;
  featured?: boolean;
  excludeSlug?: string;
}

export interface IQueryAdminArticlesParams extends IQueryArticlesParams {
  status?: EArticleStatus;
}

export interface IArticleInput {
  title: string;
  slug?: string;
  locale: Locale;
  translationGroupId?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  coverImagePublicId?: string;
  category: EArticleCategory;
  tags?: string[];
  status?: EArticleStatus;
  isFeatured?: boolean;
  publishedAt?: string;
  readingTimeMinutes?: number;
}
