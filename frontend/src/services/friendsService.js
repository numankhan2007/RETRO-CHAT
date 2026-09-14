import api from "./api";
export const sendFriendRequest = (username) => api.post("/friends/request", { username });
export const getIncomingRequests = () => api.get("/friends/requests");
export const acceptRequest = (id) => api.post(`/friends/requests/${id}/accept`);
export const declineRequest = (id) => api.post(`/friends/requests/${id}/decline`);
export const getFriends = () => api.get("/friends");
export const removeFriend = (id) => api.delete(`/friends/${id}`);
export const updateFriendPreferences = (id, preferences) => api.patch(`/friends/${id}/preferences`, preferences);
export const searchUsers = (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`);
