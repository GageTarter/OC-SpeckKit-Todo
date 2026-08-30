import apiClient from "./services.js";

const ListServices = {
  getAll() {
    return apiClient.get("lists");
  },

  create(data) {
    return apiClient.post("lists", data);
  },

  update(listId, data) {
    return apiClient.put(`lists/${listId}`, data);
  },

  remove(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};

export default ListServices;
