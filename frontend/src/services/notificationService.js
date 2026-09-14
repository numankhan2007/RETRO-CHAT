import api from "./api";

export const getNotifications = () => {
  return api.get("/notifications");
};

export const markNotificationRead = (id) => {
  return api.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return api.post("/notifications/read-all");
};
