import { api } from "./client";

export const createGroup = (name) =>
  api("/groups", { method: "POST", body: { name } });

export const listGroups = () => api("/groups");

export const getGroup = (id) => api(`/groups/${id}`);
export const addMember = (id, email) =>
  api(`/groups/${id}/members`, { method: "POST", body: { email } });