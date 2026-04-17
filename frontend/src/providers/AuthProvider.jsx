import { createContext, useContext, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { axiosInstance } from "../lib/axios";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

// Context for sharing chat data
const AuthContext = createContext({});

// Easy-to-use hook
export const useChat = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  // 1. Get auth tools from Clerk
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [chatClient, setChatClient] = useState(null);

  /**
   * REASONING: We keep the Interceptor setup separate because it only needs
   * to be set up ONCE when the app starts. It stays in the background.
   */
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return () => axiosInstance.interceptors.request.eject(interceptor);
  }, [getToken]);

  /**
   * REASONING: This is our "Chat Manager". 
   * It handles joining the chat when you log in, and leaving when you log out.
   */
  useEffect(() => {
    // START: If Clerk is still loading, do nothing yet.
    if (!authLoaded || !userLoaded) return;

    // SCENARIO A: The user is NOT logged in.
    if (!user) {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
        console.log("User logged out: Disconnected from Chat");
      }
      return; // Stop here
    }

    // SCENARIO B: The user IS logged in, but we haven't connected to Chat yet.
    if (user && !chatClient) {
      
      const startChat = async () => {
        try {
          const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
          
          // Get the secret token for Stream from our backend
          const response = await axiosInstance.get("/chat/token");
          const { token } = response.data;

          // Connect the user
          await client.connectUser(
            {
              id: user.id,
              name: user.fullName || user.username || user.id,
              image: user.imageUrl,
            },
            token
          );

          setChatClient(client);
          console.log("User logged in: Connected to Chat");
        } catch (error) {
          console.error("Failed to start chat:", error);
          toast.error("Could not connect to chat.");
        }
      };

      startChat();
    }

    // CLEANUP: If the component ever unmounts, disconnect.
    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [authLoaded, userLoaded, user, chatClient, getToken]);

  return (
    <AuthContext.Provider value={{ chatClient }}>
      {children}
    </AuthContext.Provider>
  );
}