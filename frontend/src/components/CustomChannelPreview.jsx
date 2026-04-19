import React from 'react';
import { HashIcon } from "lucide-react";

// This component shows a preview of a single channel in the list.
// We use our OWN class names (ch-item, ch-item--active) instead of
// Stream's default classes, to avoid conflicts with the SDK's built-in styles.
const CustomChannelPreview = ({ channel, setActiveChannel, activeChannel }) => {
    
    // 1. Check if this channel is the one currently selected
    const isActive = activeChannel && activeChannel.id === channel.id;

    // 2. Skip Direct Message channels in this list
    const isDirectMessage = channel.data.member_count === 2 && channel.data.id.includes("user_");
    if (isDirectMessage) return null;

    // 3. Get the unread message count
    const unreadCount = channel.countUnread();

    // 4. Handle click
    const handleClick = () => setActiveChannel(channel);

    return (
        <button onClick={handleClick} className={`ch-item ${isActive ? 'ch-item--active' : ''}`}>
            <HashIcon className="ch-item__icon" />
            <span className="ch-item__name">{channel.data.id}</span>
            {unreadCount > 0 && <div className="ch-item__badge" />}
        </button>
    );
};

export default CustomChannelPreview;