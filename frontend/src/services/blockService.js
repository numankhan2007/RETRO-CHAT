import api from "./api";

export const getBlocks = () => {
  return api.get("/blocks");
};

export const blockUser = (user_id) => {
  return api.post("/blocks", { user_id });
};

export const unblockUser = (blocked_id) => {
  return api.delete(`/blocks/${blocked_id}`);
};
