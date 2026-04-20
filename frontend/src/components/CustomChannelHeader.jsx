/*
 * CustomChannelHeader.jsx
 * -----------------------
 * This component replaces the default Stream Chat channel header bar.
 * It lives at the very top of the chat area (right panel) and shows:
 *   - Channel name (with a # or 🔒 icon, or a user avatar for DMs)
 *   - A members count button that opens MembersModal
 *   - A video call button (sends a call-link message to the channel)
 *   - An "Invite" button (only for private channels, opens InviteModal)
 *   - A pin button that opens PinnedMessagesModal
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// Lucide-react gives us clean SVG icons as React components
import { HashIcon, LockIcon, UsersIcon, PinIcon, VideoIcon } from "lucide-react";

// useChannelStateContext is a Stream SDK hook.
// It gives us live access to the currently active channel's data and state
// (members, messages, settings, etc.) without having to pass props manually.
import { useChannelStateContext } from "stream-chat-react";

// useState lets us create simple boolean toggles to show/hide modals
import { useState } from "react";

// useUser gives us the currently signed-in Clerk user object.
// We need it to figure out which member in a DM is "the other person".
import { useUser } from "@clerk/clerk-react";

// Our three modal components, each opened by a button in this header
import MembersModal from "./MembersModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import InviteModal from "./InviteModal";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const CustomChannelHeader = () => {
    // Step 1 — Pull the active channel from Stream's context.
    // `channel` is a Stream Channel object with methods like .query(), .sendMessage(), etc.
    const { channel } = useChannelStateContext();

    // Step 2 — Get the currently logged-in Clerk user.
    // We use `user.id` to filter out ourselves when identifying the "other" DM participant.
    const { user } = useUser();

    // Step 3 — Compute member count.
    // channel.state.members is a plain object where each key is a user ID.
    // Object.keys() turns those keys into an array, and .length gives us the count.
    const memberCount = Object.keys(channel.state.members).length;

    // Step 4 — Modal visibility toggles.
    // Each boolean controls whether a specific modal is shown or hidden.
    const [showInvite, setShowInvite] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showPinnedMessages, setShowPinnedMessages] = useState(false);

    // Step 5 — Store the fetched pinned messages array.
    // We fetch them lazily (only when the user clicks the pin button).
    const [pinnedMessages, setPinnedMessages] = useState([]);

    // Step 6 — Find the "other" user in a Direct Message.
    // Object.values() gives us the full member objects.
    // We look for the member whose user ID is NOT ours.
    const otherUser = Object.values(channel.state.members).find(
        (member) => member.user.id !== user.id
    );

    // Step 7 — Detect if this channel is a Direct Message.
    // DM channels have exactly 2 members, and their IDs always include "user_"
    // (because Clerk user IDs look like "user_abc123").
    const isDM = channel.data?.member_count === 2 && channel.data?.id.includes("user_");

    // ── HANDLERS ──────────────────────────────────────────────────────────────

    // Handler: Fetch pinned messages from the Stream API and open the modal.
    // channel.query() returns the full channel state, including pinned_messages.
    // We store those in state so PinnedMessagesModal can display them.
    const handleShowPinned = async () => {
        const channelState = await channel.query();
        setPinnedMessages(channelState.pinned_messages);
        setShowPinnedMessages(true);
    };

    // Handler: Start a video call.
    // We don't have a dedicated video call service, so we send a chat message
    // containing a shareable link to a /call/<channelId> route in this app.
    const handleVideoCall = async () => {
        if (channel) {
            // Build the full call URL using the current origin (e.g. http://localhost:5173)
            const callUrl = `${window.location.origin}/call/${channel.id}`;

            // Send this as a regular chat message so all members see the invite
            await channel.sendMessage({
                text: `I've started a video call. Join me here: ${callUrl}`,
            });
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        // Outer bar: full width, white background, sits between sidebar and message list
        <div className="h-14 border-b border-gray-200 flex items-center px-4 justify-between bg-white">

            {/* LEFT SIDE: channel icon + name (or DM user avatar + name) */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">

                    {/* Show a lock icon for private channels, hash for public ones */}
                    {channel.data?.private ? (
                        <LockIcon className="size-4 text-[#616061]" />
                    ) : (
                        <HashIcon className="size-4 text-[#616061]" />
                    )}

                    {/* If this is a DM AND the other user has a profile photo, show it */}
                    {isDM && otherUser?.user?.image && (
                        <img
                            src={otherUser.user.image}
                            alt={otherUser.user.name || otherUser.user.id}
                            className="size-7 rounded-full object-cover mr-1"
                        />
                    )}

                    {/* Display name: for DMs use the other person's name; for channels use channel ID */}
                    <span className="font-medium text-[#1D1C1D]">
                        {isDM ? otherUser?.user?.name || otherUser?.user?.id : channel.data?.id}
                    </span>
                </div>
            </div>

            {/* RIGHT SIDE: action buttons */}
            <div className="flex items-center gap-3">

                {/* MEMBERS BUTTON: shows member count, opens MembersModal on click */}
                <button
                    className="flex items-center gap-2 hover:bg-[#F8F8F8] py-1 px-2 rounded"
                    onClick={() => setShowMembers(true)}
                >
                    <UsersIcon className="size-5 text-[#616061]" />
                    <span className="text-sm text-[#616061]">{memberCount}</span>
                </button>

                {/* VIDEO CALL BUTTON: sends a call link as a chat message */}
                <button
                    className="hover:bg-[#F8F8F8] p-1 rounded"
                    onClick={handleVideoCall}
                    title="Start Video Call"
                >
                    <VideoIcon className="size-5 text-[#1264A3]" />
                </button>

                {/* INVITE BUTTON: only shown for private channels */}
                {channel.data?.private && (
                    <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                        Invite
                    </button>
                )}

                {/* PIN BUTTON: fetches and displays pinned messages */}
                <button className="hover:bg-[#F8F8F8] p-1 rounded" onClick={handleShowPinned}>
                    <PinIcon className="size-4 text-[#616061]" />
                </button>
            </div>

            {/* ── MODALS (rendered at the bottom so JSX stays readable) ───────── */}

            {/* MembersModal: pass all member objects and a close handler */}
            {showMembers && (
                <MembersModal
                    members={Object.values(channel.state.members)}
                    onClose={() => setShowMembers(false)}
                />
            )}

            {/* PinnedMessagesModal: pass the fetched array of pinned messages */}
            {showPinnedMessages && (
                <PinnedMessagesModal
                    pinnedMessages={pinnedMessages}
                    onClose={() => setShowPinnedMessages(false)}
                />
            )}

            {/* InviteModal: pass the full channel object so it can call channel.addMembers() */}
            {showInvite && <InviteModal channel={channel} onClose={() => setShowInvite(false)} />}
        </div>
    );
};

export default CustomChannelHeader;