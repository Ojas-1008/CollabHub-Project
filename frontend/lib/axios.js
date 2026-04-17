import axios from "axios";

// Get the backend URL from .env (matching VITE_BACKEND_URL defined there)
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Useful for cross-origin cookies if needed
});