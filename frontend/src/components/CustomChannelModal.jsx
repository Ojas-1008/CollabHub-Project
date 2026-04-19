import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon } from "lucide-react";

// This component shows a popup to create a new Public or Private channel.
const CreateChannelModal = ({ onClose }) => {
  const { client, setActiveChannel } = useChatContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 1. State Management ---
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public"); // 'public' or 'private'
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  
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
      <div className="create-channel-modal">
        {/* HEADER SECTION */}
        <header className="create-channel-modal__header">
          <h2 className="text-xl font-bold">Create New Channel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XIcon className="size-5 text-gray-400" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="create-channel-modal__form">
          {errorNote && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 border border-red-100 text-sm">
              <AlertCircleIcon className="size-4" />
              <span>{errorNote}</span>
            </div>
          )}

          {/* INPUT: CHANNEL NAME */}
          <div className="form-group mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Channel Name</label>
            <div className="relative">
              <HashIcon className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input 
                type="text" 
                value={channelName} 
                onChange={(e) => { setChannelName(e.target.value); setErrorNote(""); }}
                placeholder="e.g. project-x"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>
            {channelName && (
              <p className="text-[10px] text-blue-500 mt-1">ID will be: #{formatChannelId(channelName)}</p>
            )}
          </div>

          {/* INPUT: TYPE SELECTION */}
          <div className="form-group mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Channel Type</label>
            <div className="flex gap-4">
              <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${channelType === "public" ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                <input type="radio" className="hidden" checked={channelType === "public"} onChange={() => setChannelType("public")} />
                <div className="flex items-center gap-3">
                  <HashIcon className="size-5 text-blue-500" />
                  <div>
                    <p className="font-bold text-sm">Public</p>
                    <p className="text-[10px] text-gray-500">Open to everyone</p>
                  </div>
                </div>
              </label>

              <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${channelType === "private" ? "border-purple-500 bg-purple-50" : "bg-white"}`}>
                <input type="radio" className="hidden" checked={channelType === "private"} onChange={() => setChannelType("private")} />
                <div className="flex items-center gap-3">
                  <LockIcon className="size-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-sm">Private</p>
                    <p className="text-[10px] text-gray-500">Only invited users</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* INPUT: MEMBER SELECTION (Private only) */}
          {channelType === "private" && (
            <div className="form-group mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Add Team Members</label>
                <button 
                  type="button" 
                  onClick={() => setSelectedUsers(availableUsers.map(u => u.id))} 
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Select All
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-lg bg-gray-50 divide-y">
                {loadingUsers ? (
                   <p className="p-4 text-center text-xs text-gray-400">Loading users...</p> 
                ) : availableUsers.length === 0 ? (
                   <p className="p-4 text-center text-xs text-gray-400">No other users found</p>
                ) : (
                  availableUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedUsers.includes(user.id)} 
                        onChange={() => toggleUser(user.id)} 
                      />
                      {user.image ? (
                        <img src={user.image} className="size-6 rounded-full" alt="" />
                      ) : (
                        <UsersIcon className="size-6 p-1 bg-gray-200 rounded-full" />
                      )}
                      <span className="text-sm text-gray-700">{user.name || user.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* INPUT: DESCRIPTION */}
          <div className="form-group mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full p-2 border rounded-lg h-16 resize-none outline-none text-sm transition-all focus:border-blue-400"
            />
          </div>

          {/* BOTTOM BUTTONS */}
          <footer className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-bold text-gray-400">Cancel</button>
            <button 
              type="submit" 
              disabled={!channelName.trim() || isSaving} 
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isSaving ? "Saving..." : "Create Channel"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
