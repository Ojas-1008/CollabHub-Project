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
  const response = await axiosInstance.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
}

export async function updateTask(taskId, taskData) {
  const response = await axiosInstance.patch(`/tasks/${taskId}`, taskData);
  return response.data;
}

export async function deleteTask(taskId) {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
}


/**
 * 👤 USER APIs
 */
export async function updateUserStatus(status) {
  const response = await axiosInstance.patch("/users/status", { status });
  return response.data;
}

// Fetches the logged-in user's full profile, task stats, and recent activity.
// Returns: { user: {...}, stats: {...}, recentActivity: [...] }
export async function getUserProfile() {
  const response = await axiosInstance.get("/users/me");
  return response.data;
}

// Updates extended profile fields (bio, jobTitle, department, socialLinks, skills).
// Only send the fields you want to change — the backend won't erase the rest.
export async function updateProfile(profileData) {
  const response = await axiosInstance.patch("/users/update", profileData);
  return response.data;
}


/**
 * 🤖 AI APIs
 * Used to communicate with our backend AI endpoints (powered by Cerebras Cloud).
 */

// Sends up to 25 messages to the backend for AI-powered summarization.
// Returns: { summary: "• Point 1\n• Point 2\n..." }
export async function summarizeMessages(messages) {
  const response = await axiosInstance.post("/ai/summarize", { messages });
  return response.data;
}

// Sends a draft message to the backend for AI-powered refinement.
// Returns: { refinedText: "Your polished message here..." }
export async function refineMessage(text) {
  const response = await axiosInstance.post("/ai/refine", { text });
  return response.data;
}