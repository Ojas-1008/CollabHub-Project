import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { axiosInstance } from "../../lib/axios";

/**
 * AuthProvider
 * This component manages the "Security Handshake" between Clerk and our API.
 * It automatically adds your identity token to every backend request.
 */
const AuthProvider = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // 1. Create the Interceptor (Security Guard)
    const interceptor = axiosInstance.interceptors.request.use(async (config) => {
      try {
        // Fetch the fresh identity token from Clerk
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Auth Interceptor Error:", err);
      }
      return config;
    });

    // 2. Cleanup: Remove the interceptor if the app restarts
    return () => axiosInstance.interceptors.request.eject(interceptor);
  }, [getToken]);

  return children;
};

export default AuthProvider;