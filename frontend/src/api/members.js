import { api } from "./client";

export const listMembers = (groupId) => api(`/groups/${groupId}/members`);
