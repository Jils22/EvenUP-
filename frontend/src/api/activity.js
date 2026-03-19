import { api } from "./client";
export const getActivity = (groupId) => api(`/groups/${groupId}/activity`);


