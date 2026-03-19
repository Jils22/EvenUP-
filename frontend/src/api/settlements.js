import { api } from "./client";

export const createSettlement = (groupId, payload) =>
  api(`/groups/${groupId}/settlements`, { method: "POST", body: payload });

export const listSettlements = (groupId) =>
  api(`/groups/${groupId}/settlements`);

export const updateSettlement = (groupId, settlementId, payload) =>
  api(`/groups/${groupId}/settlements/${settlementId}`, { method: "PATCH", body: payload });

export const deleteSettlement = (groupId, settlementId) =>
  api(`/groups/${groupId}/settlements/${settlementId}`, { method: "DELETE" });
