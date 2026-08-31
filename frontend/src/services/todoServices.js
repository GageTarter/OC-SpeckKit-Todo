import apiClient from "./services.js";

const TodoServices = {
  getAll(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },

  create(listId, data) {
    return apiClient.post(`lists/${listId}/todos`, data);
  },

  update(id, data) {
    return apiClient.put(`todos/${id}`, data);
  },

  remove(id) {
    return apiClient.delete(`todos/${id}`);
  },
};

export default TodoServices;
