import React from 'react';
import { MessageSquareOff } from 'lucide-react';

/**
 * EmptyStateIndicator Component
 * 
 * This component is shown when a user has no channels in their list.
 * It's designed to be visually appealing and encouraging, rather than
 * just showing a bland text message.
 */
const EmptyStateIndicator = () => {
    return (
        <div className="team-channel-list__empty">
            <div className="empty-icon-container">
                <MessageSquareOff className="empty-icon" />
            </div>
            <p className="empty-text">No channels found</p>
            <p className="empty-subtext">Start a conversation by creating a new channel!</p>
        </div>
    );
};

export default EmptyStateIndicator;
