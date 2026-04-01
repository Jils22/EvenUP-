import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activityApi';
import { groupsApi } from '../api/groupsApi';

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: ['activity', { groupId }],
    queryFn: () => activityApi.getGroupActivity(groupId),
    enabled: !!groupId,
  });
}

export function useGlobalActivity() {
  return useQuery({
    queryKey: ['activity', 'global'],
    queryFn: async () => {
      const groups = await groupsApi.getGroups();
      const groupIds = (groups ?? []).map((g: any) => g.id).filter(Boolean);

      const perGroup = await Promise.all(
        groupIds.map(async (groupId: string) => {
          try {
            return await activityApi.getGroupActivity(groupId);
          } catch {
            return [];
          }
        })
      );

      return perGroup.flat().sort((a: any, b: any) => {
        const at = new Date(a.created_at ?? 0).getTime();
        const bt = new Date(b.created_at ?? 0).getTime();
        return bt - at;
      });
    },
  });
}
