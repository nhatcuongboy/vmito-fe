import { api, ApiResponse, dedupGet } from './base';
import {
  IAdminArticle,
  IArticle,
  IArticleCategoryCount,
  IArticleInput,
  IArticlePage,
  IArticleSitemapEntry,
  IArticleSummary,
  IQueryAdminArticlesParams,
  IQueryArticlesParams,
} from '@/types/news';

export const NewsService = {
  /** Published articles, newest first. */
  getArticles: async (params?: IQueryArticlesParams): Promise<IArticlePage> => {
    const response = await dedupGet<ApiResponse<IArticlePage>>('/articles', {
      params,
    });
    return response.data.data!;
  },

  /**
   * A single published article by slug. Returns null on 404 so a Server
   * Component can call notFound() instead of turning a missing article into a
   * 500.
   */
  getArticle: async (slug: string): Promise<IArticle | null> => {
    try {
      const response = await dedupGet<ApiResponse<IArticle>>(
        `/articles/${slug}`,
        { skipGlobalError: true }
      );
      return response.data.data ?? null;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  getRelatedArticles: async (slug: string): Promise<IArticleSummary[]> => {
    try {
      const response = await dedupGet<ApiResponse<IArticleSummary[]>>(
        `/articles/${slug}/related`,
        { skipGlobalError: true }
      );
      return response.data.data ?? [];
    } catch {
      // The related rail is decoration — never fail the article page over it.
      return [];
    }
  },

  getCategoryCounts: async (
    locale?: string
  ): Promise<IArticleCategoryCount[]> => {
    const response = await dedupGet<ApiResponse<IArticleCategoryCount[]>>(
      '/articles/categories',
      { params: locale ? { locale } : undefined }
    );
    return response.data.data ?? [];
  },

  /** Slugs for sitemap.ts and generateStaticParams. */
  getSitemapArticles: async (): Promise<IArticleSitemapEntry[]> => {
    const response =
      await dedupGet<ApiResponse<IArticleSitemapEntry[]>>('/articles/sitemap');
    return response.data.data ?? [];
  },

  /** Fire-and-forget from the client once the article has rendered. */
  trackView: async (slug: string): Promise<void> => {
    await api.post(`/articles/${slug}/view`, undefined, {
      skipGlobalError: true,
    });
  },

  // ---------------------------------------------------------------- admin

  getAdminList: async (
    params?: IQueryAdminArticlesParams
  ): Promise<IArticlePage<IAdminArticle>> => {
    const response = await api.get<ApiResponse<IArticlePage<IAdminArticle>>>(
      '/admin/articles',
      { params }
    );
    return response.data.data!;
  },

  getAdminArticle: async (id: string): Promise<IAdminArticle> =>
    (await api.get<ApiResponse<IAdminArticle>>(`/admin/articles/${id}`)).data
      .data!,

  create: async (input: IArticleInput): Promise<IAdminArticle> =>
    (await api.post<ApiResponse<IAdminArticle>>('/admin/articles', input)).data
      .data!,

  update: async (
    id: string,
    input: Partial<IArticleInput>
  ): Promise<IAdminArticle> =>
    (await api.put<ApiResponse<IAdminArticle>>(`/admin/articles/${id}`, input))
      .data.data!,

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/articles/${id}`);
  },

  uploadCover: async (
    file: File
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await api.post<
      ApiResponse<{ url: string; publicId: string }>
    >('/admin/articles/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },
};

const isNotFound = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404;
