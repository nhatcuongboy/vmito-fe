import { toaster } from '@/components/ui/toaster';
import { getToastMessage } from '@/lib/i18n/toastMessages';
import { api, ApiResponse } from './base';
import {
  IPaymentReminder,
  CreateSingleReminderRequest,
  CreateAggregateReminderRequest,
  CreateCustomReminderRequest,
  MarkPaymentReminderPaidRequest,
  RejectPaymentReminderRequest,
  PaymentReminderStatus,
} from './types';

export const PaymentReminderService = {
  createSingleReminder: async (
    data: CreateSingleReminderRequest
  ): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      '/payment-reminders',
      data
    );
    toaster.success({ title: getToastMessage('reminderSentSuccessfully') });
    return response.data.data!;
  },

  createAggregateReminder: async (
    data: CreateAggregateReminderRequest
  ): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      '/payment-reminders/aggregate',
      data
    );
    toaster.success({ title: getToastMessage('reminderSentSuccessfully') });
    return response.data.data!;
  },

  createCustomReminder: async (
    data: CreateCustomReminderRequest
  ): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      '/payment-reminders/custom',
      data
    );
    toaster.success({ title: getToastMessage('reminderSentSuccessfully') });
    return response.data.data!;
  },

  getReminders: async (query: {
    role: 'creator' | 'recipient';
    status?: PaymentReminderStatus;
  }): Promise<IPaymentReminder[]> => {
    const response = await api.get<ApiResponse<IPaymentReminder[]>>(
      '/payment-reminders',
      { params: query }
    );
    return response.data.data || [];
  },

  remindAgain: async (id: string): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      `/payment-reminders/${id}/remind`
    );
    toaster.success({ title: getToastMessage('reminderSentSuccessfully') });
    return response.data.data!;
  },

  markCollected: async (id: string): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      `/payment-reminders/${id}/mark-collected`
    );
    toaster.success({
      title: getToastMessage('reminderMarkedCollectedSuccessfully'),
    });
    return response.data.data!;
  },

  markPaid: async (
    id: string,
    data: MarkPaymentReminderPaidRequest
  ): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      `/payment-reminders/${id}/mark-paid`,
      data
    );
    toaster.success({
      title: getToastMessage('reminderMarkedPaidSuccessfully'),
    });
    return response.data.data!;
  },

  reject: async (
    id: string,
    data: RejectPaymentReminderRequest
  ): Promise<IPaymentReminder> => {
    const response = await api.post<ApiResponse<IPaymentReminder>>(
      `/payment-reminders/${id}/reject`,
      data
    );
    toaster.success({
      title: getToastMessage('reminderRejectedSuccessfully'),
    });
    return response.data.data!;
  },
};
