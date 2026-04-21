import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon, SearchIcon, CheckIcon } from "lucide-react";

// This component shows a popup to create a new Public or Private channel.
const CreateChannelModal = ({ onClose }) => {
  const { client, setActiveChannel } = useChatContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 1. State Management ---
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public"); // 'public' or 'private'
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorNote, setErrorNote] = useState("");

  // --- 2. Fetching Data ---
  // Load everyone from the chat system so we can add them to the channel
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!client || !client.user) return;
      
      setLoadingUsers(true);
      try {
        // Find everyone except the current user
        const response = await client.queryUsers({ id: { $ne: client.user.id } }, { name: 1 });
        
        // Filter out system bots
        const realUsers = response.users.filter((u) => !u.id.startsWith("recording-"));
        setAvailableUsers(realUsers);
      } catch (err) {
        console.error("User fetch error:", err);
        Sentry.captureException(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAllUsers();
  }, [client]);

  // Filter users by search query
  const filteredUsers = availableUsers.filter(user => 
    (user.name || user.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- 3. UI Logic ---
  // If the channel is Public, everyone is automatically a member
  useEffect(() => {
    if (channelType === "public") {
      const allIds = availableUsers.map((u) => u.id);
      setSelectedUsers(allIds);
    } else {
      setSelectedUsers([]); // Start empty for private channels
    }
  }, [channelType, availableUsers]);

  // Turns "My Channel" into a safe ID "my-channel"
  const formatChannelId = (input) => {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")          // spaces to dashes
      .replace(/[^a-z0-9-_]/g, "")    // remove weird characters
      .slice(0, 20);                  // limit length
  };

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // --- 4. Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (channelName.trim().length < 3) {
      setErrorNote("Channel name must be at least 3 characters");
      return;
    }

    setIsSaving(true);
    setErrorNote("");

    try {
      const generatedId = formatChannelId(channelName);
      
      const channel = client.channel("messaging", generatedId, {
        name: channelName.trim(),
        description: description.trim(),
        members: [client.user.id, ...selectedUsers],
        visibility: channelType,
        discoverable: channelType === "public",
      });

      // Create the channel on the server
      await channel.watch();

      // Switch to the new channel in the app
      setActiveChannel(channel);
      setSearchParams({ channel: generatedId });
      
      toast.success(`Success! #${channelName} is ready.`);
      onClose();
    } catch (err) {
      console.error("Create error:", err);
      toast.error("Naming conflict or error. Try another name.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="create-channel-modal-overlay">
      <div className="create-channel-modal ch-scrollbar">
        {/* HEADER SECTION */}
        <header className="create-channel-modal__header">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Create New Channel</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-purple-400 hover:text-white transition-colors">
            <XIcon className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="create-channel-modal__form">
          {errorNote && (
            <div className="bg-red-900/40 text-red-300 p-3 rounded-lg flex items-center gap-2 mb-4 border border-red-700/50 text-sm">
              <AlertCircleIcon className="size-4" />
              <span>{errorNote}</span>
            </div>
          )}

          {/* INPUT: CHANNEL NAME */}
          <div className="form-group mb-5">
            <label className="block text-[13px] font-bold text-purple-200 mb-1.5 uppercase tracking-wide">Channel Name</label>
            <div className="relative">
              <HashIcon className="absolute left-3.5 top-3.5 size-4 text-purple-400/60" />
              <input 
                type="text" 
                value={channelName} 
                onChange={(e) => { setChannelName(e.target.value); setErrorNote(""); }}
                placeholder="e.g. project-x"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner"
                autoFocus
              />
            </div>
            {channelName && (
              <p className="text-[11px] text-purple-400/80 mt-1.5 font-medium pl-1">ID will be: #{formatChannelId(channelName)}</p>
            )}
          </div>

          {/* INPUT: TYPE SELECTION */}
          <div className="form-group mb-6">
            <label className="block text-[13px] font-bold text-purple-200 mb-2.5 uppercase tracking-wide">Channel Type</label>
            <div className="flex gap-3">
              <label className={`relative flex-1 p-4 border rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${channelType === "public" ? "border-purple-400 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-400/30"}`}>
                <input type="radio" className="hidden" checked={channelType === "public"} onChange={() => setChannelType("public")} />
                {/* Active glow */}
                {channelType === "public" && <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent -z-10" />}
                
                <div className="flex flex-col gap-2 relative z-10">
                  <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${channelType === "public" ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-purple-400 group-hover:text-purple-300"}`}>
                    <HashIcon className="size-4.5" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm tracking-wide transition-colors ${channelType === "public" ? "text-white" : "text-purple-200 group-hover:text-white"}`}>Public</p>
                    <p className="text-[11px] text-purple-400/80 mt-0.5 font-medium leading-tight">Open to your team</p>
                  </div>
                </div>
              </label>

              <label className={`relative flex-1 p-4 border rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${channelType === "private" ? "border-violet-400 bg-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-violet-400/30"}`}>
                <input type="radio" className="hidden" checked={channelType === "private"} onChange={() => setChannelType("private")} />
                {channelType === "private" && <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-transparent -z-10" />}
                
                <div className="flex flex-col gap-2 relative z-10">
                  <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${channelType === "private" ? "bg-violet-500/30 text-violet-200" : "bg-white/5 text-purple-400 group-hover:text-violet-300"}`}>
                    <LockIcon className="size-4.5" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm tracking-wide transition-colors ${channelType === "private" ? "text-white" : "text-purple-200 group-hover:text-white"}`}>Private</p>
                    <p className="text-[11px] text-purple-400/80 mt-0.5 font-medium leading-tight">Invite only access</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* INPUT: MEMBER SELECTION (Private only) */}
          {channelType === "private" && (
            <div className="form-group mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-[13px] font-bold text-purple-200 uppercase tracking-wide">Add Team Members</label>
                <button 
                  type="button" 
                  onClick={() => setSelectedUsers(availableUsers.map(u => u.id))} 
                  className="text-[11px] uppercase tracking-wider text-purple-400/80 font-bold hover:text-purple-200 transition-colors"
                >
                  Select All
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3.5 top-2.5 size-4 text-purple-400/50" />
                <input 
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner"
                />
              </div>

              <div className="max-h-44 overflow-y-auto ch-scrollbar border border-white/10 rounded-xl bg-purple-950/20 divide-y divide-white/5">
                {loadingUsers ? (
                   <div className="flex items-center justify-center p-6"><p className="text-xs text-purple-400/80 animate-pulse font-medium">Loading users...</p></div> 
                ) : filteredUsers.length === 0 ? (
                   <div className="flex items-center justify-center p-6"><p className="text-xs text-purple-400/80 font-medium">No users found</p></div>
                ) : (
                  filteredUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer group transition-colors">
                      {/* Custom Checkbox */}
                      <div className={`flex items-center justify-center size-5 rounded-md border transition-all ${selectedUsers.includes(user.id) ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-purple-500/40 group-hover:border-purple-400'}`}>
                        {selectedUsers.includes(user.id) && <CheckIcon className="size-3.5 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedUsers.includes(user.id)} 
                        onChange={() => toggleUser(user.id)} 
                      />
                      {user.image ? (
                        <img src={user.image} className="size-8 rounded-xl object-cover border border-white/10 shadow-sm" alt="" />
                      ) : (
                        <div className="size-8 rounded-xl bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center border border-white/10 shadow-sm">
                          <UsersIcon className="size-4 text-purple-200" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-purple-100 group-hover:text-white transition-colors">{user.name || user.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* INPUT: DESCRIPTION */}
          <div className="form-group mb-6">
            <label className="block text-[13px] font-bold text-purple-200 mb-1.5 uppercase tracking-wide">Description <span className="text-[10px] text-purple-400/60 ml-1">(Optional)</span></label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl h-20 resize-none outline-none text-[13px] text-white placeholder-purple-300/40 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner ch-scrollbar"
            />
          </div>

          {/* BOTTOM BUTTONS */}
          <footer className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-3 text-[13px] font-bold tracking-wide uppercase text-purple-300/80 hover:text-white hover:bg-white/5 rounded-xl transition-all">Cancel</button>
            <button 
              type="submit" 
              disabled={!channelName.trim() || isSaving} 
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-violet-600 border border-purple-500/50 text-white rounded-xl font-bold uppercase tracking-wide text-[13px] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  <span>Saving...</span>
                </div>
              ) : "Create Channel"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
