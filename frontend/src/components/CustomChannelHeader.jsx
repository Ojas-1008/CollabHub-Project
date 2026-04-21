/*
 * CustomChannelHeader.jsx
 * -----------------------
 * This component replaces the default Stream Chat channel header bar.
 * It lives at the very top of the chat area (right panel) and shows:
 *   - Channel name (with a # or 🔒 icon, or a user avatar for DMs)
 *   - A members count button that opens MembersModal
 *   - A video call button (sends a call-link message to the channel)
 *   - An "Invite" button (only for private channels, opens InviteModal)
 *   - A pin button that toggles the PinnedMessages sidebar
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// Lucide-react gives us clean SVG icons as React components
import { HashIcon, LockIcon, UsersIcon, PinIcon, VideoIcon, ListTodoIcon, FolderOpenIcon } from "lucide-react";

// useChannelStateContext is a Stream SDK hook.
// It gives us live access to the currently active channel's data and state
// (members, messages, settings, etc.) without having to pass props manually.
import { useChannelStateContext, useChatContext } from "stream-chat-react";
//                                ^^^^^^^^^^^^^^^
// useChatContext gives us the Stream `client` object so we can call
// client.unpinMessage() to unpin messages from the sidebar.

// useState lets us create simple boolean toggles to show/hide modals
import { useState } from "react";

// useUser gives us the currently signed-in Clerk user object.
// We need it to figure out which member in a DM is "the other person".
import { useUser } from "@clerk/react";

// Our modal/drawer components, each opened by a button in this header
import MembersModal from "./MembersModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import InviteModal from "./InviteModal";
import TaskListDrawer from "./TaskListDrawer"; // Import Task Drawer
import FileExplorer from "./FileExplorer"; // Import File Explorer

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const CustomChannelHeader = () => {
    // Step 1 — Pull the active channel from Stream's context.
    // `channel` is a Stream Channel object with methods like .query(), .sendMessage(), etc.
    const { channel } = useChannelStateContext();

    // Pull the Stream chat client. We need it to call client.unpinMessage().
    const { client } = useChatContext();

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
    const [showTasks, setShowTasks] = useState(false); // Toggle for tasks
    const [showFiles, setShowFiles] = useState(false); // Toggle for file explorer

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

    // Handler: Toggle the pinned messages sidebar.
    // If the sidebar is already open, close it.
    // If it's closed, fetch the latest pinned messages and open it.
    const handleShowPinned = async () => {
        // If sidebar is already open, just close it (toggle behavior)
        if (showPinnedMessages) {
            setShowPinnedMessages(false);
            return;
        }
        // Otherwise: ask Stream for the full channel state.
        // channel.query() returns an object that includes pinned_messages.
        const channelState = await channel.query();
        setPinnedMessages(channelState.pinned_messages);
        setShowPinnedMessages(true);
    };

    // Handler: Unpin a message.
    // Called when the user clicks the "Unpin" button inside the sidebar.
    // client.unpinMessage(message) talks to the Stream API to remove the pin.
    // After unpinning, we remove that message from our local state immediately
    // so the sidebar updates without needing a full refresh.
    const handleUnpin = async (message) => {
        try {
            await client.unpinMessage(message);

            // Remove the unpinned message from the local list so the sidebar updates instantly.
            // .filter() creates a NEW array that keeps every message EXCEPT the one we just unpinned.
            setPinnedMessages((prev) => prev.filter((m) => m.id !== message.id));
        } catch (err) {
            console.error("Failed to unpin message:", err);
        }
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
        <>
            {/* Outer bar: full width, frosted glass background, sticky top */}
            <div className="h-16 border-b border-purple-500/10 flex items-center px-6 justify-between bg-white/70 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-[50] relative">

            {/* LEFT SIDE: channel icon + name (or DM user avatar + name) */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">

                    {/* Show a lock icon for private channels, hash for public ones */}
                    {channel.data?.private ? (
                        <div className="size-8 rounded-lg bg-violet-100 flex items-center justify-center border border-violet-200">
                            <LockIcon className="size-4.5 text-violet-600" />
                        </div>
                    ) : (
                        <div className="size-8 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-200">
                            <HashIcon className="size-4.5 text-purple-600" />
                        </div>
                    )}

                    {/* If this is a DM AND the other user has a profile photo, show it */}
                    {isDM && otherUser?.user?.image && (
                        <img
                            src={otherUser.user.image}
                            alt={otherUser.user.name || otherUser.user.id}
                            className="size-8 rounded-[10px] object-cover border border-purple-200/50 shadow-sm"
                        />
                    )}

                    {/* Display name: for DMs use the other person's name; for channels use channel ID */}
                    <div className="flex flex-col justify-center">
                        <span className="font-extrabold text-gray-900 tracking-tight text-[17px] leading-tight">
                            {isDM ? otherUser?.user?.name || otherUser?.user?.id : channel.data?.id}
                        </span>
                        {isDM && otherUser?.user?.status && (
                            <span className="text-[12px] font-medium text-purple-600/70 mt-0.5 truncate max-w-[200px]">
                                {otherUser.user.status}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: action buttons */}
            <div className="flex items-center gap-2">

                {/* MEMBERS BUTTON: Glass Pill */}
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/60 bg-white/50 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all text-gray-600 hover:text-purple-600"
                    onClick={() => setShowMembers(true)}
                >
                    <UsersIcon className="size-4.5" />
                    <span className="text-[13px] font-bold">{memberCount}</span>
                </button>

                {/* INVITE BUTTON: Glass Pill (Private only) */}
                {channel.data?.private && (
                    <button 
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-violet-200/60 bg-violet-50/50 hover:bg-violet-100/80 hover:border-violet-300 transition-all text-violet-600 font-bold text-[13px]" 
                        onClick={() => setShowInvite(true)}
                    >
                        Invite
                    </button>
                )}

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                {/* VIDEO CALL BUTTON: Its own distinct color (Blue) */}
                <button
                    className="p-2 rounded-xl border border-transparent hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all text-blue-500"
                    onClick={handleVideoCall}
                    title="Start Video Call"
                >
                    <VideoIcon className="size-4.5" />
                </button>

                {/* PIN BUTTON */}
                <button
                    className={`p-2 rounded-xl border transition-all duration-200 ${showPinnedMessages ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                    onClick={handleShowPinned}
                    title={showPinnedMessages ? "Close pinned messages" : "View pinned messages"}
                >
                    <PinIcon className="size-4.5" />
                </button>

                {/* TASK BUTTON */}
                <button 
                    className={`p-2 rounded-xl border transition-all duration-200 ${showTasks ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                    onClick={() => setShowTasks(!showTasks)}
                    title={showTasks ? "Close tasks" : "View channel tasks"}
                >
                    <ListTodoIcon className="size-4.5" />
                </button>

                {/* FILES BUTTON */}
                <button
                    className={`p-2 rounded-xl border transition-all duration-200 ${showFiles ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                    onClick={() => setShowFiles(!showFiles)}
                    title={showFiles ? "Close file explorer" : "Browse shared files"}
                >
                    <FolderOpenIcon className="size-4.5" />
                </button>
            </div>

            {/* ── MODALS (rendered OUTSIDE the header div to fix clipping) ─── */}

            {/* MembersModal: pass all member objects and a close handler */}
            {showMembers && (
                <MembersModal
                    members={Object.values(channel.state.members)}
                    onClose={() => setShowMembers(false)}
                />
            )}

            {/* PinnedMessagesModal: pass the fetched array + the unpin handler.
                This now renders as a sidebar, not a center modal. */}
            {showPinnedMessages && (
                <PinnedMessagesModal
                    pinnedMessages={pinnedMessages}
                    onClose={() => setShowPinnedMessages(false)}
                    onUnpin={handleUnpin}
                />
            )}

            {/* InviteModal: pass the full channel object so it can call channel.addMembers() */}
            {showInvite && <InviteModal channel={channel} onClose={() => setShowInvite(false)} />}

            {/* TaskListDrawer: Slides in from the right to show channel tasks */}
            {showTasks && <TaskListDrawer onClose={() => setShowTasks(false)} />}

            {/* FileExplorer: Slides in from the right to show all shared files.
                onClose sets showFiles back to false, hiding the panel. */}
            {showFiles && <FileExplorer onClose={() => setShowFiles(false)} />}
        </>
    );
};

export default CustomChannelHeader;