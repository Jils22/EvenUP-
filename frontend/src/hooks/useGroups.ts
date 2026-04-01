import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groupsApi';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getGroups,
  });
}

export function useGroupDetails(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.getGroup(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, email }: { groupId: string; email: string }) => 
      groupsApi.addMember(groupId, email),
    onSuccess: (data, variables) => {
      // Invalidate specific group so UI updates with new member
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}
