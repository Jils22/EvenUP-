import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses';

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: ['expenses', { groupId }],
    queryFn: () => expensesApi.getGroupExpenses(groupId),
    enabled: !!groupId,
  });
}

export function useBalances(groupId?: string) {
  return useQuery({
    queryKey: ['balances', { groupId }],
    queryFn: () => expensesApi.getBalances(groupId),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: any }) => 
      expensesApi.createExpense(groupId, payload),
    onSuccess: (data, variables) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['expenses', { groupId: variables.groupId }] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}
