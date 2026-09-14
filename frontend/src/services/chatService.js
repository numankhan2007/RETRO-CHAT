import api from "./api";
export const getConversations = () => api.get("/chat/conversations");
export const getMessages = (friendId, cursor) => api.get(`/chat/conversations/${friendId}/messages` + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""));
export const sendMessage = (friendId, data) => api.post(`/chat/conversations/${friendId}/messages`, data);
export const markAsRead = (friendId) => api.post(`/chat/conversations/${friendId}/read`);
export const pinMessage = (friendId, messageId) => api.patch(`/chat/conversations/${friendId}/messages/${messageId}/pin`);
export const editMessage = (friendId, messageId, content) => api.put(`/chat/conversations/${friendId}/messages/${messageId}`, { content });
export const deleteMessage = (friendId, messageId) => api.delete(`/chat/conversations/${friendId}/messages/${messageId}`);

// Group endpoints
export const createGroup = (data) => api.post("/groups", data);
export const getGroup = (groupId) => api.get(`/groups/${groupId}`);
export const updateGroup = (groupId, data) => api.patch(`/groups/${groupId}`, data);
export const addGroupMember = (groupId, userId) => api.post(`/groups/${groupId}/members/${userId}`);
export const removeGroupMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);
export const updateGroupMemberRole = (groupId, userId, role) => api.patch(`/groups/${groupId}/members/${userId}/role`, { role });
export const getGroupMessages = (groupId, cursor) => api.get(`/groups/${groupId}/messages` + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""));
export const sendGroupMessage = (groupId, data) => api.post(`/groups/${groupId}/messages`, data);
