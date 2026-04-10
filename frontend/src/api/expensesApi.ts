import { apiClient } from './client';
import { Expense, BalanceSummary } from '../types/api';

// Mapping function to convert backend snake_case to frontend camelCase
const mapExpense = (data: any): Expense => ({
  id: data.id,
  groupId: data.group_id,
  title: data.title,
  amount: data.amount_minor / 100,
  paidBy: data.paid_by,
  date: data.created_at || new Date().toISOString(),
  splitType: data.split_type,
  participants: data.splits ? data.splits.map((s: any) => ({
    userId: s.user_id,
    amountOwed: s.share_minor / 100,
    hasPaid: false
  })) : [],
  category: data.category,
  createdAt: data.created_at || new Date().toISOString()
});

export const expensesApi = {
  getGroupExpenses: async (groupId: string): Promise<Expense[]> => {
    const { data } = await apiClient.get<any[]>(`/groups/${groupId}/expenses`);
    return data.map(mapExpense);
  },

  getExpense: async (groupId: string, expenseId: string): Promise<Expense> => {
    const { data } = await apiClient.get<any>(`/groups/${groupId}/expenses/${expenseId}`);
    return mapExpense(data);
  },

  createExpense: async (groupId: string, payload: Partial<Expense>): Promise<Expense> => {
    const backendPayload: any = {
      title: payload.title,
      amount: payload.amount,
      paid_by_user_id: payload.paidBy,
      split_type: payload.splitType,
      category: payload.category,
      participant_user_ids: payload.participants?.map(p => p.userId) || []
    };
    if (payload.splits) backendPayload.splits = payload.splits;
    if (payload.percents) backendPayload.percents = payload.percents;

    const { data } = await apiClient.post<any>(`/groups/${groupId}/expenses`, backendPayload);
    return mapExpense(data);
  },

  updateExpense: async (groupId: string, expenseId: string, payload: Partial<Expense> & { splits?: any[], percents?: any[], participant_user_ids?: string[] }): Promise<Expense> => {
    const backendPayload: any = {
      title: payload.title,
      amount: payload.amount,
      split_type: payload.splitType,
      category: payload.category,
    };
    if (payload.participant_user_ids) backendPayload.participant_user_ids = payload.participant_user_ids;
    if (payload.splits) backendPayload.splits = payload.splits;
    if (payload.percents) backendPayload.percents = payload.percents;

    const { data } = await apiClient.patch<any>(`/groups/${groupId}/expenses/${expenseId}`, backendPayload);
    return mapExpense(data);
  },

  deleteExpense: async (groupId: string, expenseId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/expenses/${expenseId}`);
  },

  getBalances: async (groupId: string): Promise<BalanceSummary> => {
    const { data } = await apiClient.get<BalanceSummary>(`/groups/${groupId}/balances`);
    return data;
  },

  getUserBalances: async (): Promise<any> => {
    const { data } = await apiClient.get<any>(`/users/me/balances`);
    return data;
  },

  // Get all expenses across ALL groups for the current user
  getAllExpenses: async (): Promise<Expense[]> => {
    // Note: Backend doesn't have a global /expenses endpoint yet. 
    // Returning empty array for now to avoid 404 crashes.
    return [];
  },

  getAnalytics: async (): Promise<any> => {
    const { data } = await apiClient.get<any>(`/users/me/analytics`);
    return data;
  },

  exportExpenses: async (groupId: string): Promise<any> => {
    const { data } = await apiClient.get(`/groups/${groupId}/export`, { responseType: 'blob' });
    return data;
  },

  getAIInsights: async (): Promise<any> => {
    const { data } = await apiClient.get('/ai/insights');
    return data;
  },
};
