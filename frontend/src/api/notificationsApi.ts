import { apiClient } from "./client";

export const notificationsApi = {
  listNotifications: async (limit = 50) => {
    const { data } = await apiClient.get(`/notifications?limit=${limit}`);
    return data;
  },
};