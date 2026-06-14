import api from './axios';

export const getExpenses = (groupId) => api.get(`/groups/${groupId}/expenses`);
export const getExpense = (groupId, expenseId) => api.get(`/groups/${groupId}/expenses/${expenseId}`);
export const createExpense = (groupId, data) => api.post(`/groups/${groupId}/expenses`, data);
export const updateExpense = (groupId, expenseId, data) => api.put(`/groups/${groupId}/expenses/${expenseId}`, data);
export const deleteExpense = (groupId, expenseId) => api.delete(`/groups/${groupId}/expenses/${expenseId}`);
