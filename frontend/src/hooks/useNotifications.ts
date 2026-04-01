import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../api/notificationsApi";

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => notificationsApi.listNotifications(limit),
  });
}