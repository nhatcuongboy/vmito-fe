import { api, ApiResponse } from './base';
import { ISessionExpense } from './types';

export const SessionExpensesService = {
  getSessionExpenses: async (sessionId: string): Promise<ISessionExpense[]> => {
    const response = await api.get<ApiResponse<ISessionExpense[]>>(
      `/sessions/${sessionId}/expenses`
    );
    return response.data.data || [];
  },

  createExpense: async (
    sessionId: string,
    name: string,
    amount: number
  ): Promise<ISessionExpense> => {
    const response = await api.post<ApiResponse<ISessionExpense>>(
      `/sessions/${sessionId}/expenses`,
      { name, amount }
    );
    return response.data.data!;
  },

  updateExpense: async (
    sessionId: string,
    expenseId: string,
    name?: string,
    amount?: number
  ): Promise<ISessionExpense> => {
    const response = await api.patch<ApiResponse<ISessionExpense>>(
      `/sessions/${sessionId}/expenses/${expenseId}`,
      { name, amount }
    );
    return response.data.data!;
  },

  deleteExpense: async (
    sessionId: string,
    expenseId: string
  ): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/expenses/${expenseId}`);
  },
};
