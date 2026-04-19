import React from 'react';
import { HashIcon } from "lucide-react";

// This component shows a preview of a single channel in the list
const CustomChannelPreview = ({ channel, setActiveChannel, activeChannel }) => {
    
    // 1. Check if this channel is the one currently active/selected
    const isActive = activeChannel && activeChannel.id === channel.id;

    // 2. Identify if this is a direct message (DM) channel
    // We check if it has 2 members and the ID starts with 'user_'
    const isDirectMessage = channel.data.member_count === 2 && channel.data.id.includes("user_");

    // If it's a DM, we don't want to show it in this list, so we return null
    if (isDirectMessage) {
        return null;
    }

    // 3. Get the number of unread messages for this channel
    const unreadCount = channel.countUnread();

    // 4. Handle clicking the channel button
    const handleClick = () => {
        setActiveChannel(channel);
    };

    // 5. Define CSS classes (Styling)
    // We start with the basic styles for every channel item
    let buttonClasses = "str-chat__channel-preview-messenger transition-colors flex items-center w-full text-left px-4 py-2 rounded-lg mb-1 font-medium hover:bg-blue-50/80 min-h-9";
    
    // If the channel is active, we add extra styles to highlight it
    if (isActive) {
        buttonClasses += " !bg-black/20 !hover:bg-black/20 border-l-8 border-purple-500 shadow-lg text-blue-900";
    }

    return (
        <button onClick={handleClick} className={buttonClasses}>
            {/* The hash icon at the start of the channel name */}
            <HashIcon className="w-4 h-4 text-[#9b9b9b] mr-2" />
            
            {/* The name of the channel */}
            <span className="str-chat__channel-preview-messenger-name flex-1">
                {channel.data.id}
            </span>

            {/* If there are unread messages, show a red badge with the count */}
            {unreadCount > 0 && (
                <span className="flex items-center justify-center ml-2 size-4 text-xs rounded-full bg-red-500 text-white">
                    {unreadCount}
                </span>
            )}
        </button>
    );
};

export default CustomChannelPreview;