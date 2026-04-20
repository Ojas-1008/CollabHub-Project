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

// Icons and Styles
import { HashIcon, PlusIcon, UsersIcon } from "lucide-react";
import "../styles/stream-chat-theme.css";

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
    setSearchParams({ channel: channel.id });
  };

  // --- CUSTOM MESSAGE ACTIONS ---
  // customMessageActions is a { 'Label': handlerFn } map still supported by MessageList.
  // The handler receives the (message, event) when the user clicks the action.
  const customMessageActions = {
    "Create Task": (message) => {
      setSelectedTaskMessage(message);
      setIsTaskModalOpen(true);
    },
  };

  return (
    <div className="chat-wrapper">
      <Chat client={chatClient}>
        <div className="chat-container">
          
          {/* LEFT SIDEBAR: Branding and Channel Lists */}
          <aside className="str-chat__channel-list">
            <div className="team-channel-list">
              
              {/* APP HEADER */}
              <div className="team-channel-list__header">
                <div className="brand-container">
                  <img src="/logo.png" alt="Logo" className="brand-logo" />
                  <span className="brand-name">CollabHub</span>
                </div>
                <UserButton />
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
                  <MessageList customMessageActions={customMessageActions} />
                  <MessageInput />
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