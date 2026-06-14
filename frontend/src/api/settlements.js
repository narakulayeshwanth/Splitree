import api from './axios';
export const getSettlements = (groupId) => api.get(`/groups/${groupId}/settlements`);
export const createSettlement = (groupId, data) => api.post(`/groups/${groupId}/settlements`, data);
