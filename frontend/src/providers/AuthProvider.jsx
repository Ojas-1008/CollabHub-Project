import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

const AuthProvider = ({ children }) => {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [chatClient, setChatClient] = useState(null);

  useEffect(() => {
    // Wait for Clerk to load
    if (!authLoaded || !userLoaded) return;

    // Handle disconnected state
    if (!user) {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
      return;
    }

    const initChat = async () => {
      const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);

      try {
        // 1. Get Clerk session token
        const clerkToken = await getToken();
        
        // 2. Fetch Stream token from our backend (secures the connection)
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/token`, {
          headers: {
            Authorization: `Bearer ${clerkToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch stream token");
        
        const { token } = await response.json();

        // 3. Connect to Stream
        await client.connectUser(
          {
            id: user.id,
            name: user.fullName || user.username || user.id,
            image: user.imageUrl,
          },
          token
        );

        setChatClient(client);
        console.log("Successfully connected to Stream Chat");
      } catch (error) {
        console.error("Stream connection error:", error);
        toast.error("Failed to connect to chat service.");
      }
    };

    initChat();

    // Cleanup on unmount or user change
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [authLoaded, userLoaded, user]);

  return (
    <ChatContext.Provider value={{ chatClient }}>
      {children}
    </ChatContext.Provider>
  );
};

export default AuthProvider;
