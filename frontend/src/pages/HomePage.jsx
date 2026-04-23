import { useState, useEffect } from "react";
import { UserButton } from "@clerk/react";
import { useSearchParams } from "react-router-dom";
import { useStreamChat } from "../hooks/useStreamChat";

import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";


import PageLoader from "../components/PageLoader";
import CreateChannelModal from "../components/CustomChannelModal";
import TaskModal from "../components/TaskModal";
import CustomChannelPreview from "../components/CustomChannelPreview";
import CustomChannelHeader from "../components/CustomChannelHeader";
import UsersList from "../components/UsersList";
import StatusInputPopover from "../components/StatusInputPopover";
import EmptyStateIndicator from "../components/EmptyStateIndicator";
import CustomMessageInput from "../components/CustomMessageInput";
import useReactionUserDM from "../hooks/useReactionUserDM";

// Icons and Styles
import { HashIcon, PlusIcon, UsersIcon } from "lucide-react";
import "../styles/stream-chat-theme.css";

/**
 * ReactionDMRegistrar must be rendered INSIDE <Chat> so it can access
 * the Stream client via useChatContext(). It registers the global
 * reaction-user click handler and renders nothing itself.
 */
const ReactionDMRegistrar = () => {
  useReactionUserDM();
  return null;
};

const HomePage = () => {
  // 1. Get our custom chat client and status from our hook
  const { chatClient, isLoading, error } = useStreamChat();
  
  // 2. Set up local state for UI management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Task Integration State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskMessage, setSelectedTaskMessage] = useState(null);

  // 3. Sync the active channel based on the URL (?channel=...)
  // We also read ?message= to support the "Jump to Message" feature in FileExplorer.
  // When a user clicks "Jump" on a file card, we navigate to /?channel=X&message=Y.
  // MessageList accepts a `highlightedMessageId` prop that scrolls to and highlights
  // the specified message automatically.
  const messageId = searchParams.get("message") || undefined;

  useEffect(() => {
    if (!chatClient) return;

    const channelId = searchParams.get("channel");
    if (channelId) {
      // Look up the channel data using its ID
      const channel = chatClient.channel("messaging", channelId);
      setActiveChannel(channel);
    }
  }, [chatClient, searchParams]);

  // Handle global loading or error states
  if (error) return <div className="h-screen w-screen flex items-center justify-center text-red-400 bg-[#2d094b]">Connection error. Please refresh.</div>;
  if (isLoading || !chatClient) return <PageLoader />;

  // Helper function to handle switching channels
  const handleSelectChannel = (channel) => {
    if (channel) {
      setSearchParams({ channel: channel.id });
    } else {
      setSearchParams({});
    }
  };

  // --- CUSTOM MESSAGE ACTIONS ---
  // customMessageActions is an object where each key is a label shown in the
  // right-click (three-dot ⋯) menu, and the value is a function that runs
  // when the user clicks that option. The function receives the message object.
  const customMessageActions = {

    // Create Task: converts a message into a tracked task (existing feature)
    "Create Task": (message) => {
      setSelectedTaskMessage(message);
      setIsTaskModalOpen(true);
    },

    // Pin Message: pins the message so it appears in the Pinned Messages sidebar.
    // chatClient.pinMessage() calls the Stream API and marks that message as pinned.
    // A pinned: true flag is stored on the message object inside Stream.
    "Pin Message": async (message) => {
      try {
        await chatClient.pinMessage(message);
      } catch (err) {
        console.error("Failed to pin message:", err);
      }
    },

    // Unpin Message: removes the pin from a message.
    // chatClient.unpinMessage() sets pinned: false on that message in Stream.
    // Useful if someone pinned the wrong message.
    "Unpin Message": async (message) => {
      try {
        await chatClient.unpinMessage(message);
      } catch (err) {
        console.error("Failed to unpin message:", err);
      }
    },
  };

  return (
    <div className="chat-wrapper">
      <Chat client={chatClient}>
        {/* Registers the reaction-user DM click handler inside the Chat context */}
        <ReactionDMRegistrar />
        <div className="chat-container">
          
          {/* LEFT SIDEBAR: Branding and Channel Lists */}
          <aside className="sidebar-container">
            <div className="team-channel-list">
              
              {/* APP HEADER */}
              <div className="team-channel-list__header flex-col items-start gap-4 w-full">
                {/* Glassmorphic Floating Container */}
                <div className="flex items-center justify-between w-full p-2.5 px-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Logo" className="w-[30px] h-[30px] drop-shadow-lg" />
                    <span className="text-[1.15rem] font-extrabold uppercase tracking-[0.05em] bg-gradient-to-r from-white via-white to-purple-400 bg-clip-text text-transparent">
                      CollabHub
                    </span>
                  </div>
                  <UserButton />
                </div>
                {/* STATUS INPUT POPOVER */}
                <div className="w-full border-t border-purple-500/20 pt-2 relative z-50">
                  <StatusInputPopover />
                </div>
              </div>

              <div className="team-channel-list__content">
                {/* BUTTON: CREATE CHANNEL */}
                <div className="create-channel-section">
                  <button onClick={() => setIsModalOpen(true)} className="create-channel-btn">
                    <PlusIcon className="size-4" />
                    <span>Create Channel</span>
                  </button>
                </div>

                {/* THE MAIN CHANNELS LIST */}
                <ChannelList
                  filters={{ members: { $in: [chatClient.user.id] } }}
                  options={{ state: true, watch: true }}
                  EmptyStateIndicator={EmptyStateIndicator}
                  Preview={(previewProps) => (
                    <CustomChannelPreview
                      {...previewProps}
                      setActiveChannel={handleSelectChannel}
                      activeChannel={activeChannel}
                    />
                  )}
                  List={({ children, loading, error: listError }) => (
                    <div className="channel-sections">
                      <div className="section-header-pill">
                        <HashIcon className="size-4" />
                        <span>Channels</span>
                      </div>

                      {loading && <p className="px-4 text-xs opacity-50 text-white/50">Loading channels...</p>}
                      {listError && <p className="px-4 text-xs text-red-400">Failed to load channels.</p>}
                      
                      <div className="channels-list">{children}</div>
                    </div>
                  )}
                />

                {/* DIRECT MESSAGES LIST */}
                <div className="channel-sections mt-4">
                  <div className="section-header-pill">
                    <UsersIcon className="size-4" />
                    <span>Direct Messages</span>
                  </div>
                  <UsersList activeChannel={activeChannel} />
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT VIEW: The actual chat conversation */}
          <main className="chat-main">
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <CustomChannelHeader />
                  {/* Pass highlightedMessageId so the chat auto-scrolls to the message
                      that was linked from the File Explorer "Jump to Message" button.
                      Stream's MessageList handles the scrolling automatically. */}
                  <MessageList
                    customMessageActions={customMessageActions}
                    highlightedMessageId={messageId}
                  />
                  <MessageInput Input={CustomMessageInput} />
                </Window>
                <Thread />
                {/* TaskModal must be inside Channel so it can access Stream's channel context */}
                {isTaskModalOpen && (
                  <TaskModal
                    message={selectedTaskMessage}
                    onClose={() => {
                      setIsTaskModalOpen(false);
                      setSelectedTaskMessage(null);
                    }}
                  />
                )}
              </Channel>
            ) : (
              // Empty selection state
              <div className="empty-chat-state">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 opacity-10 mb-4 grayscale" />
                <p className="text-gray-800 font-bold text-lg">Select a channel to start messaging</p>
                <p className="text-gray-500 text-sm mt-1">Pick a channel from the sidebar</p>
              </div>
            )}
          </main>
        </div>

        {/* MODAL: Channel creation popup */}
        {isModalOpen && <CreateChannelModal onClose={() => setIsModalOpen(false)} />}
      </Chat>
    </div>
  );
};

export default HomePage;