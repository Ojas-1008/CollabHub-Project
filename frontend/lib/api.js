import { axiosInstance } from "./axios";

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

/**
 * 📝 TASK APIs
 * Used to communicate with our backend Task endpoints.
 */

export async function createTask(taskData) {
  const response = await axiosInstance.post("/tasks", taskData);
  return response.data;
}

export async function getTasks(channelId) {
  const response = await axiosInstance.get(`/tasks/channel/${channelId}`);
  return response.data;
}

export async function updateTaskStatus(taskId, status) {
  const response = await axiosInstance.patch(`/tasks/${taskId}`, { status });
  return response.data;
}

/**
 * 👤 USER APIs
 */
export async function updateUserStatus(status) {
  const response = await axiosInstance.patch("/users/status", { status });
  return response.data;
}