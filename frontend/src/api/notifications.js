import { api, apiClient } from "./client";

// Individual exports used by .jsx files
export const listNotifications = (limit = 50) => api(`/notifications?limit=${limit}`);

// ── Named object export for TypeScript hooks ──
export const notificationsApi = {
  listNotifications: async (limit = 50) => {
    const { data } = await apiClient.get(`/notifications?limit=${limit}`);
    return data;
  },
};