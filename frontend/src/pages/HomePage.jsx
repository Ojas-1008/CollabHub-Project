import { useState, useEffect } from "react";
import { UserButton } from "@clerk/react";
import { useSearchParams } from "react-router-dom";
import { useStreamChat } from "../hooks/useStreamChat";

import {
  Chat,
  Channel,
  ChannelList,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";

import PageLoader from "../components/PageLoader";
import CreateChannelModal from "../components/CustomChannelModal";

// Icons and Styles
import { HashIcon, PlusIcon } from "lucide-react";
import "../styles/stream-chat-theme.css";

const HomePage = () => {
  // 1. Get our custom chat client and status from our hook
  const { chatClient, isLoading, error } = useStreamChat();
  
  // 2. Set up local state for UI management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

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
  if (error) return <div className="p-8 text-red-500 text-center">Connection error. Please refresh.</div>;
  if (isLoading || !chatClient) return <PageLoader />;

  // Helper function to handle switching channels
  const handleSelectChannel = (channel) => {
    setSearchParams({ channel: channel.id });
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
                  <span className="brand-name">Slap</span>
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
                  onSelect={(channel) => setSearchParams({ channel: channel.id })}
                  options={{ state: true, watch: true }}
                  List={({ children, loading, error: listError }) => (
                    <div className="channel-sections">
                      <div className="section-header">
                        <HashIcon className="size-4" />
                        <span>Channels</span>
                      </div>

                      {loading && <p className="px-4 text-xs opacity-50">Loading channels...</p>}
                      {listError && <p className="px-4 text-xs text-red-400">Failed to load channels.</p>}
                      
                      <div className="channels-list">{children}</div>
                    </div>
                  )}
                />
              </div>
            </div>
          </aside>

          {/* RIGHT VIEW: The actual chat conversation */}
          <main className="chat-main">
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            ) : (
              // Empty selection state
              <div className="empty-chat-state">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 opacity-10 mb-4 grayscale" />
                <p className="text-gray-400">Select a channel to start messaging</p>
              </div>
            )}
          </main>
        </div>

        {/* MODAL: Creation popups */}
        {isModalOpen && <CreateChannelModal onClose={() => setIsModalOpen(false)} />}
      </Chat>
    </div>
  );
};

export default HomePage;