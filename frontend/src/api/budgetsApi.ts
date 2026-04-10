import { apiClient } from './client';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
  color?: string;
}

export const budgetsApi = {
  getBudgets: async (): Promise<Budget[]> => {
    const { data } = await apiClient.get<Budget[]>('/budgets');
    return data;
  },

  createBudget: async (budget: Partial<Budget>): Promise<Budget> => {
    const { data } = await apiClient.post<Budget>('/budgets', budget);
    return data;
  },

  updateBudget: async (id: string, budget: Partial<Budget>): Promise<Budget> => {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}`, budget);
    return data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`);
  }
};
