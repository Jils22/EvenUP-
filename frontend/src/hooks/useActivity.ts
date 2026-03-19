import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';

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
    queryFn: activityApi.getGlobalActivity,
  });
}
