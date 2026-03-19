import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from '../api/settlements';

export function useSettlements() {
  return useQuery({
    queryKey: ['settlements'],
    queryFn: settlementsApi.getSettlements,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settlementsApi.createSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      settlementsApi.updateSettlement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}
