import api from "./api";
export const getConversations = () => api.get("/chat/conversations");
export const getMessages = (friendId, cursor) => api.get(`/chat/conversations/${friendId}/messages` + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""));
export const sendMessage = (friendId, data) => api.post(`/chat/conversations/${friendId}/messages`, data);
export const markAsRead = (friendId) => api.post(`/chat/conversations/${friendId}/read`);
export const pinMessage = (friendId, messageId) => api.patch(`/chat/conversations/${friendId}/messages/${messageId}/pin`);
export const editMessage = (friendId, messageId, content) => api.put(`/chat/conversations/${friendId}/messages/${messageId}`, { content });
export const deleteMessage = (friendId, messageId) => api.delete(`/chat/conversations/${friendId}/messages/${messageId}`);
