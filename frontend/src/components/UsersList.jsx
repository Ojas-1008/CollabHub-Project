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
                const channelId = [client.user.id, user.id].sort().join("-").slice(0, 64);
                const isActive = activeChannel && activeChannel.id === channelId;

                // We use our own ch-item class names (not Stream's) to avoid layout conflicts
                const buttonStyle = `ch-item ${isActive ? 'ch-item--active' : ''}`;

                const tempChannel = client.channel("messaging", channelId);
                const unreadCount = tempChannel.countUnread();

                return (
                    <button key={user.id} onClick={() => startDirectMessage(user)} className={buttonStyle}>
                        {/* User avatar with online status dot */}
                        <div className="ch-item__avatar">
                            {user.image ? (
                                <img src={user.image} alt={user.name || user.id} className="ch-item__avatar-img" />
                            ) : (
                                <div className="ch-item__avatar-fallback">
                                    {(user.name || user.id).charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={`ch-item__status-dot ${user.online ? 'ch-item__status-dot--online' : ''}`} />
                        </div>

                        {/* Name and Status */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="ch-item__name leading-tight">{user.name || user.id}</span>
                            {user.status && (
                                <span className="ch-item__status truncate w-full mt-0.5">
                                    {user.status}
                                </span>
                            )}
                        </div>

                        {/* Unread count badge — same pill style as channel list */}
                        {unreadCount > 0 && (
                            <div className="ch-item__badge shrink-0 relative z-10">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );

};

export default UsersList;