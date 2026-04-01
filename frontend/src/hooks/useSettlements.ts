import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from '../api/settlementsApi';

// Get settlements for a specific group
export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', { groupId }],
    queryFn: () => settlementsApi.getGroupSettlements(groupId),
    enabled: !!groupId,
  });
}

// Deprecated: Use useGroupSettlements instead
export function useSettlements() {
  return useQuery({
    queryKey: ['settlements'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: any }) => 
      settlementsApi.createSettlement(groupId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', { groupId: variables.groupId }] });
      queryClient.invalidateQueries({ queryKey: ['balances', { groupId: variables.groupId }] });
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, id, payload }: { groupId: string; id: string; payload: any }) => 
      settlementsApi.updateSettlement(groupId, id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', { groupId: variables.groupId }] });
      queryClient.invalidateQueries({ queryKey: ['balances', { groupId: variables.groupId }] });
    },
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, id }: { groupId: string; id: string }) => 
      settlementsApi.deleteSettlement(groupId, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', { groupId: variables.groupId }] });
      queryClient.invalidateQueries({ queryKey: ['balances', { groupId: variables.groupId }] });
    },
  });
}
