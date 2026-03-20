import { apiClient } from './client';

// Matches backend `ActivityItemOut` + `ActivityListOut` shapes.
// The backend returns `{ items: [...] }` for group activity.
type BackendActivityItemOut = {
  id: string;
  created_at: string;
  actor_id: string;
  event_type?: string | null;
  verb?: string | null;
  target_id?: string | null;
  data?: Record<string, any>;
};

type BackendActivityListOut = {
  items: BackendActivityItemOut[];
};

export const activityApi = {
  getGroupActivity: async (groupId: string): Promise<BackendActivityItemOut[]> => {
    const { data } = await apiClient.get<BackendActivityListOut | BackendActivityItemOut[]>(
      `/groups/${groupId}/activity`
    );
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items;
  },
};
