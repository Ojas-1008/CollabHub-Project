import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../../lib/api";
import * as Sentry from "@sentry/react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// This custom hook handles connecting a user to the Stream Chat service
export const useStreamChat = () => {
    const { user } = useUser();
    const [chatClient, setChatClient] = useState(null);

    // 1. Fetch the secure chat token from our backend API
    const { data: tokenData, isLoading, error } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!user?.id, // Only run if we have a user logged in
    });

    // 2. Connect the user to the chat client
    useEffect(() => {
        // We need a user ID, a token, and an API key to proceed
        if (!user?.id || !tokenData?.token || !STREAM_API_KEY) {
            return;
        }

        // Initialize the chat client
        const client = StreamChat.getInstance(STREAM_API_KEY);
        
        // This flag helps prevent memory leaks or settings state if page changes
        let isStopped = false;

        const connectUser = async () => {
            try {
                // Pick a name to display: Full Name > Username > ID
                const displayName = user.fullName || user.username || user.id;

                // Attempt to connect the user
                await client.connectUser(
                    {
                        id: user.id,
                        name: displayName,
                        image: user.imageUrl || undefined,
                    },
                    tokenData.token
                );

                // If the connection is still valid, update our state
                if (!isStopped) {
                    setChatClient(client);
                }
            } catch (err) {
                console.error("Failed to connect to chat:", err);
                Sentry.captureException(err);
            }
        };

        connectUser();

        // CLEANUP: Disconnect user when they log out or leave the page
        return () => {
            isStopped = true;
            client.disconnectUser();
        };
    }, [user?.id, tokenData?.token]);

    return { chatClient, isLoading, error };
};