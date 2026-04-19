import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../../lib/api";
import * as Sentry from "@sentry/react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useStreamChat = () => {
    const { user } = useUser();
    const [chatClient, setChatClient] = useState(null);

    // 1. Use React Query to fetch our chat token from the backend
    const { data: tokenData, isLoading, error } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!user?.id,
    });

    // 2. Connect to the Stream service once we have both a user and a token
    useEffect(() => {
        // If anything is missing, we can't start yet
        if (!user?.id || !tokenData?.token || !STREAM_API_KEY) return;

        const client = StreamChat.getInstance(STREAM_API_KEY);
        let isCancelled = false;

        const connectUser = async () => {
            try {
                // Decide which name to display (FullName -> Username -> Email -> ID)
                const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || user.id;

                await client.connectUser(
                    {
                        id: user.id,
                        name: name,
                        image: user.imageUrl || undefined,
                    },
                    tokenData.token
                );

                // If the user hasn't left the page, save the connected client
                if (!isCancelled) {
                    setChatClient(client);
                }
            } catch (err) {
                console.error("Stream Chat connection error:", err);
                Sentry.captureException(err, {
                    tags: { component: "useStreamChat" },
                    extra: { context: "stream_chat_connection", userId: user.id },
                });
            }
        };

        connectUser();

        // Cleanup: Disconnect when the user leaves or logs out
        return () => {
            isCancelled = true;
            client.disconnectUser();
        };
    }, [user?.id, tokenData?.token]);

    return { chatClient, isLoading, error };
};