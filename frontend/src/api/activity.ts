import { apiClient } from './client';
import { ActivityItem } from '../types/api';

export const activityApi = {
  getGroupActivity: async (groupId: string): Promise<ActivityItem[]> => {
    const { data } = await apiClient.get<ActivityItem[]>(`/groups/${groupId}/activity`);
    return data;
  },
  
  // Potential global activity feed if supported by backend
  getGlobalActivity: async (): Promise<ActivityItem[]> => {
    const { data } = await apiClient.get<ActivityItem[]>('/activity');
    return data;
  }
};
