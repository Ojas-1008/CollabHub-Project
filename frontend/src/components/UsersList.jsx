import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import { CircleIcon } from "lucide-react";

const UsersList = ({ activeChannel }) => {
    const { client } = useChatContext();
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. Function to fetch other users from the chat system
    const fetchUsers = async () => {
        // If the chat client isn't ready yet, return an empty list
        if (!client || !client.user) return [];

        // Query users where ID is NOT my own ID
        const response = await client.queryUsers(
            { id: { $ne: client.user.id } },
            { name: 1 }, 
            { limit: 20 }
        );

        // Remove any system or recording users from the list
        const actualUsers = response.users.filter((user) => !user.id.startsWith("recording-"));
        
        return actualUsers;
    };

    // 2. Use React Query to handle the data fetching state
    const { data: users = [], isLoading, isError } = useQuery({
        queryKey: ["users-list", client?.user?.id],
        queryFn: fetchUsers,
        enabled: !!client?.user,
        staleTime: 1000 * 60 * 5, // Data stays 'fresh' for 5 minutes
    });

    // 3. Logic to create or open a Direct Message (DM)
    const startDirectMessage = async (targetUser) => {
        if (!targetUser || !client || !client.user) return;

        try {
            // Create a unique channel ID for these two users
            // We sort the IDs so the channel ID is the same no matter who clicks first
            const userIds = [client.user.id, targetUser.id].sort();
            const channelId = userIds.join("-").slice(0, 64);

            const channel = client.channel("messaging", channelId, {
                members: [client.user.id, targetUser.id],
            });

            // "Watch" the channel to get updates
            await channel.watch();

            // Update the URL to show this channel
            setSearchParams({ channel: channel.id });
        } catch (error) {
            console.error("Error creating DM:", error);
            // Log the error for tracking
            Sentry.captureException(error);
        }
    };

    // 4. Handle different loading/error states
    if (isLoading) return <div className="team-channel-list__message">Loading users...</div>;
    if (isError) return <div className="team-channel-list__message">Failed to load users</div>;
    if (users.length === 0) return <div className="team-channel-list__message">No other users found</div>;

    // 5. Render the list of users
    return (
        <div className="team-channel-list__users">
            {users.map((user) => {
                // Calculate the channel ID to check status
                const channelId = [client.user.id, user.id].sort().join("-").slice(0, 64);
                const isActive = activeChannel && activeChannel.id === channelId;

                // Handle conditional button styling
                let buttonStyle = "str-chat__channel-preview-messenger";
                if (isActive) {
                    buttonStyle += " !bg-black/20 !hover:bg-black/20 border-l-8 border-purple-500 shadow-lg";
                }

                // Get unread count for this specific user's DM
                const tempChannel = client.channel("messaging", channelId);
                const unreadCount = tempChannel.countUnread();

                return (
                    <button
                        key={user.id}
                        onClick={() => startDirectMessage(user)}
                        className={buttonStyle}
                    >
                        <div className="flex items-center gap-2 w-full">
                            {/* Avatar section */}
                            <div className="relative">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name || user.id}
                                        className="w-4 h-4 rounded-full"
                                    />
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
                                        <span className="text-xs text-white">
                                            {(user.name || user.id).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Online/Offline Dot */}
                                <CircleIcon
                                    className={`w-2 h-2 absolute -bottom-0.5 -right-0.5 ${
                                        user.online ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"
                                    }`}
                                />
                            </div>

                            {/* Name section */}
                            <span className="str-chat__channel-preview-messenger-name truncate">
                                {user.name || user.id}
                            </span>

                            {/* Unread count badge */}
                            {unreadCount > 0 && (
                                <span className="flex items-center justify-center ml-2 size-4 text-xs rounded-full bg-red-500 text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default UsersList;