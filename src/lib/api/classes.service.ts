import { api, ApiResponse } from './base';
import {
  ClassStatus,
  IClass,
  IClassInput,
  IClassPage,
  IBrowseClassesParams,
} from '@/types/class';

export const ClassesService = {
  browse: async (params?: IBrowseClassesParams): Promise<IClassPage> => {
    const response = await api.get<ApiResponse<IClassPage>>('/classes', {
      params,
    });
    return response.data.data!;
  },
  get: async (id: string): Promise<IClass> =>
    (await api.get<ApiResponse<IClass>>(`/classes/${id}`)).data.data!,
  mine: async (): Promise<IClass[]> =>
    (await api.get<ApiResponse<IClass[]>>('/classes/mine')).data.data || [],
  sitemap: async (): Promise<Array<Pick<IClass, 'slug' | 'updatedAt'>>> =>
    (
      await api.get<ApiResponse<Array<Pick<IClass, 'slug' | 'updatedAt'>>>>(
        '/classes/sitemap'
      )
    ).data.data || [],
  create: async (input: IClassInput): Promise<IClass> =>
    (await api.post<ApiResponse<IClass>>('/classes', input)).data.data!,
  update: async (id: string, input: Partial<IClassInput>): Promise<IClass> =>
    (await api.put<ApiResponse<IClass>>(`/classes/${id}`, input)).data.data!,
  setStatus: async (id: string, status: ClassStatus): Promise<IClass> =>
    (await api.patch<ApiResponse<IClass>>(`/classes/${id}/status`, { status }))
      .data.data!,
  remove: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};
