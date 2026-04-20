import React from 'react';
import { HashIcon, LogOut } from "lucide-react";
import { useChatContext } from 'stream-chat-react';

// This component shows a preview of a single channel in the list.
// We use our OWN class names (ch-item, ch-item--active) instead of
// Stream's default classes, to avoid conflicts with the SDK's built-in styles.
const CustomChannelPreview = ({ channel, setActiveChannel, activeChannel }) => {
    const { client } = useChatContext();
    
    // 1. Check if this channel is the one currently selected
    const isActive = activeChannel && activeChannel.id === channel.id;

    // 2. Skip Direct Message channels in this list
    const isDirectMessage = channel.data.member_count === 2 && channel.data.id.includes("user_");
    if (isDirectMessage) return null;

    // 3. Get the unread message count
    const unreadCount = channel.countUnread();

    // 4. Handle selection
    const handleClick = () => setActiveChannel(channel);

    // 5. Handle Leave Channel
    const handleLeave = async (e) => {
        e.stopPropagation(); // Don't trigger channel selection
        
        const confirmLeave = window.confirm(`Are you sure you want to leave #${channel.data.id || channel.data.name}?`);
        
        if (confirmLeave) {
            try {
                await channel.removeMembers([client.userID]);
                // If we left the currently active channel, clear it
                if (isActive) {
                    setActiveChannel(null);
                }
            } catch (error) {
                console.error("Error leaving channel:", error);
                alert("Failed to leave channel. Please try again.");
            }
        }
    };

    return (
        <div className={`ch-item ${isActive ? 'ch-item--active' : ''}`} onClick={handleClick}>
            <HashIcon className="ch-item__icon" />
            <span className="ch-item__name">{channel.data.id || channel.data.name}</span>
            {unreadCount > 0 && <div className="ch-item__badge" />}
            
            <button 
                className="ch-item__leave-btn" 
                onClick={handleLeave}
                title="Leave Channel"
            >
                <LogOut className="size-3.5" />
            </button>
        </div>
    );
};

export default CustomChannelPreview;