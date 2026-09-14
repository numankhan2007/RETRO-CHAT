import api from "./api";
export const updateTheme = (data) => api.put("/users/me/theme", data);
