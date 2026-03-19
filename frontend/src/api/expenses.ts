import { apiClient } from './client';
import { Expense, BalanceSummary } from '../types/api';

export const expensesApi = {
  getGroupExpenses: async (groupId: string): Promise<Expense[]> => {
    const { data } = await apiClient.get<Expense[]>(`/groups/${groupId}/expenses`);
    return data;
  },

  getExpense: async (expenseId: string): Promise<Expense> => {
    const { data } = await apiClient.get<Expense>(`/expenses/${expenseId}`);
    return data;
  },

  createExpense: async (groupId: string, payload: Partial<Expense>): Promise<Expense> => {
    const { data } = await apiClient.post<Expense>(`/groups/${groupId}/expenses`, payload);
    return data;
  },

  updateExpense: async (expenseId: string, payload: Partial<Expense>): Promise<Expense> => {
    const { data } = await apiClient.patch<Expense>(`/expenses/${expenseId}`, payload);
    return data;
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    await apiClient.delete(`/expenses/${expenseId}`);
  },

  getBalances: async (groupId?: string): Promise<BalanceSummary[]> => {
    // If groupId is not provided, backend should return global balances.
    const url = groupId ? `/groups/${groupId}/balances` : `/balances`;
    const { data } = await apiClient.get<BalanceSummary[]>(url);
    return data;
  }
};
