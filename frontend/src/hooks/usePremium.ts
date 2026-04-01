import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { badgesApi, recurringApi, shoppingApi } from '../api/premiumApi';

// ─── Badges ─────────────────────────────────────────────────────────────────
export function useMyBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: badgesApi.getMyBadges,
    staleTime: 60_000, // badges update infrequently
  });
}

export function useBadgeSummary() {
  return useQuery({
    queryKey: ['badges', 'summary'],
    queryFn: badgesApi.getBadgeSummary,
    staleTime: 60_000,
  });
}

// ─── Recurring Expenses ─────────────────────────────────────────────────────
export function useRecurring(groupId: string) {
  return useQuery({
    queryKey: ['recurring', groupId],
    queryFn: () => recurringApi.list(groupId),
    enabled: !!groupId,
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: any }) =>
      recurringApi.create(groupId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['recurring', vars.groupId] });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, recurringId }: { groupId: string; recurringId: string }) =>
      recurringApi.delete(groupId, recurringId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['recurring', vars.groupId] });
    },
  });
}

export function useToggleRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, recurringId, active }: { groupId: string; recurringId: string; active: boolean }) =>
      recurringApi.update(groupId, recurringId, { active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['recurring', vars.groupId] });
    },
  });
}

// ─── Shopping List ───────────────────────────────────────────────────────────
export function useShoppingList(groupId: string) {
  return useQuery({
    queryKey: ['shopping', groupId],
    queryFn: () => shoppingApi.list(groupId),
    enabled: !!groupId,
    refetchInterval: 5000, // poll every 5s as light alternative to WS in simple setups
  });
}

export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, name, quantity }: { groupId: string; name: string; quantity?: string }) =>
      shoppingApi.addItem(groupId, { name, quantity }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['shopping', vars.groupId] });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, itemId, checked }: { groupId: string; itemId: string; checked: boolean }) =>
      shoppingApi.updateItem(groupId, itemId, { checked }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['shopping', vars.groupId] });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, itemId }: { groupId: string; itemId: string }) =>
      shoppingApi.deleteItem(groupId, itemId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['shopping', vars.groupId] });
    },
  });
}

export function useClearCheckedItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => shoppingApi.clearChecked(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['shopping', groupId] });
    },
  });
}
