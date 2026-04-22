import { HashIcon, LockIcon, UsersIcon, PinIcon, VideoIcon, ListTodoIcon, FolderOpenIcon } from "lucide-react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { useState } from "react";
import { useUser } from "@clerk/react";

import MembersModal from "./MembersModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import InviteModal from "./InviteModal";
import TaskListDrawer from "./TaskListDrawer";
import FileExplorer from "./FileExplorer";

const CustomChannelHeader = () => {
    const { channel } = useChannelStateContext();
    const { client } = useChatContext();
    const { user } = useUser();

    const memberCount = Object.keys(channel.state.members).length;

    const [showInvite, setShowInvite] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showPinnedMessages, setShowPinnedMessages] = useState(false);
    const [showTasks, setShowTasks] = useState(false);
    const [showFiles, setShowFiles] = useState(false);

    const [pinnedMessages, setPinnedMessages] = useState([]);

    const otherUser = Object.values(channel.state.members).find(
        (member) => member.user.id !== user.id
    );

    const isDM = channel.data?.member_count === 2 && channel.data?.id.includes("user_");

    const handleShowPinned = async () => {
        if (showPinnedMessages) {
            setShowPinnedMessages(false);
            return;
        }

        const channelState = await channel.query();
        setPinnedMessages(channelState.pinned_messages);
        setShowPinnedMessages(true);
    };

    const handleUnpin = async (message) => {
        try {
            await client.unpinMessage(message);
            setPinnedMessages((prev) => prev.filter((m) => m.id !== message.id));
        } catch (err) {
            console.error("Failed to unpin message:", err);
        }
    };

    const handleVideoCall = async () => {
        if (channel) {
            const callUrl = `${window.location.origin}/call/${channel.id}`;
            await channel.sendMessage({
                text: `I've started a video call. Join me here: ${callUrl}`,
            });
        }
    };

    return (
        <>
            <div className="h-16 border-b border-purple-500/10 flex items-center px-6 justify-between bg-white/70 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-[50] relative">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        {channel.data?.private ? (
                            <div className="size-8 rounded-lg bg-violet-100 flex items-center justify-center border border-violet-200">
                                <LockIcon className="size-4.5 text-violet-600" />
                            </div>
                        ) : (
                            <div className="size-8 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-200">
                                <HashIcon className="size-4.5 text-purple-600" />
                            </div>
                        )}

                        {isDM && otherUser?.user?.image && (
                            <img
                                src={otherUser.user.image}
                                alt={otherUser.user.name || otherUser.user.id}
                                className="size-8 rounded-[10px] object-cover border border-purple-200/50 shadow-sm"
                            />
                        )}

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

                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/60 bg-white/50 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all text-gray-600 hover:text-purple-600"
                        onClick={() => setShowMembers(true)}
                    >
                        <UsersIcon className="size-4.5" />
                        <span className="text-[13px] font-bold">{memberCount}</span>
                    </button>

                    {channel.data?.private && (
                        <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-violet-200/60 bg-violet-50/50 hover:bg-violet-100/80 hover:border-violet-300 transition-all text-violet-600 font-bold text-[13px]"
                            onClick={() => setShowInvite(true)}
                        >
                            Invite
                        </button>
                    )}

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    <button
                        className="p-2 rounded-xl border border-transparent hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all text-blue-500"
                        onClick={handleVideoCall}
                        title="Start Video Call"
                    >
                        <VideoIcon className="size-4.5" />
                    </button>

                    <button
                        className={`p-2 rounded-xl border transition-all duration-200 ${showPinnedMessages ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                        onClick={handleShowPinned}
                        title={showPinnedMessages ? "Close pinned messages" : "View pinned messages"}
                    >
                        <PinIcon className="size-4.5" />
                    </button>

                    <button
                        className={`p-2 rounded-xl border transition-all duration-200 ${showTasks ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                        onClick={() => setShowTasks(!showTasks)}
                        title={showTasks ? "Close tasks" : "View channel tasks"}
                    >
                        <ListTodoIcon className="size-4.5" />
                    </button>

                    <button
                        className={`p-2 rounded-xl border transition-all duration-200 ${showFiles ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'border-transparent hover:bg-white hover:border-purple-200 hover:shadow-sm text-gray-500 hover:text-purple-500'}`}
                        onClick={() => setShowFiles(!showFiles)}
                        title={showFiles ? "Close file explorer" : "Browse shared files"}
                    >
                        <FolderOpenIcon className="size-4.5" />
                    </button>
                </div>
            </div>

            {showMembers && (
                <MembersModal
                    members={Object.values(channel.state.members)}
                    onClose={() => setShowMembers(false)}
                />
            )}

            {showPinnedMessages && (
                <PinnedMessagesModal
                    pinnedMessages={pinnedMessages}
                    onClose={() => setShowPinnedMessages(false)}
                    onUnpin={handleUnpin}
                />
            )}

            {showInvite && <InviteModal channel={channel} onClose={() => setShowInvite(false)} />}

            {showTasks && <TaskListDrawer onClose={() => setShowTasks(false)} />}

            {showFiles && <FileExplorer onClose={() => setShowFiles(false)} />}
        </>
    );
};

export default CustomChannelHeader;