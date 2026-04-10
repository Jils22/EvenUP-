import { apiClient } from './client';

export interface ApprovalVote {
  user_id: string;
  vote: 'approved' | 'rejected';
  voted_at: string;
}

export interface PendingExpense {
  id: string;
  group_id: string;
  title: string;
  amount_minor: number;
  paid_by: string;
  split_type: string;
  category?: string;
  status: string;
  approvals: ApprovalVote[];
  required_approvals: number;
  expires_at?: string;
}

export const approvalsApi = {
  /** Fetch all pending expenses awaiting consensus in a group */
  getPending: async (groupId: string): Promise<PendingExpense[]> => {
    const { data } = await apiClient.get<PendingExpense[]>(
      `/groups/${groupId}/expenses/pending`
    );
    return data;
  },

  /** Cast an "approved" vote on a pending expense */
  approve: async (groupId: string, expenseId: string): Promise<PendingExpense> => {
    const { data } = await apiClient.post<PendingExpense>(
      `/groups/${groupId}/expenses/${expenseId}/approve`
    );
    return data;
  },

  /** Cast a "rejected" vote on a pending expense */
  reject: async (groupId: string, expenseId: string): Promise<PendingExpense> => {
    const { data } = await apiClient.post<PendingExpense>(
      `/groups/${groupId}/expenses/${expenseId}/reject`
    );
    return data;
  },

  /** Creator withdraws their own pending expense */
  withdraw: async (groupId: string, expenseId: string): Promise<PendingExpense> => {
    const { data } = await apiClient.delete<PendingExpense>(
      `/groups/${groupId}/expenses/${expenseId}/pending`
    );
    return data;
  },
};
