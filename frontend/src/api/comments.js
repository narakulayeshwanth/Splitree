import api from './axios';
export const getComments = (expenseId) => api.get(`/expenses/${expenseId}/comments`);
export const createComment = (expenseId, text) => api.post(`/expenses/${expenseId}/comments`, { text });
