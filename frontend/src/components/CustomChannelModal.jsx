import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon } from "lucide-react";

// This component shows a popup to create a new Public or Private channel.
const CreateChannelModal = ({ onClose }) => {
  const { client, setActiveChannel } = useChatContext();
  const [_, setSearchParams] = useSearchParams();

  // 1. Basic Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("public"); // can be 'public' or 'private'
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // 2. UI and Data State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // EFFECT: Load all available users from Stream Chat so we can add them to our channel
  useEffect(() => {
    async function fetchUsers() {
      if (!client?.user) return;
      setIsLoadingUsers(true);
      try {
        // Find users that are NOT the logged-in user
        const response = await client.queryUsers({ id: { $ne: client.user.id } }, { name: 1 });
        // Filter out any system or recording users to keep it clean
        const filteredUsers = response.users.filter((user) => !user.id.startsWith("recording-"));
        setUsers(filteredUsers);
      } catch (err) {
        console.error("Failed to load users", err);
        Sentry.captureException(err);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    fetchUsers();
  }, [client]);

  // EFFECT: Automatically select everyone if the channel is Public
  useEffect(() => {
    if (type === "public") {
      setSelectedMembers(users.map((u) => u.id));
    } else {
      setSelectedMembers([]); // Start fresh for private channels
    }
  }, [type, users]);

  // LOGIC: Turns a name like "Cool Team" into a safe ID like "cool-team"
  const generateIdFromName = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")          // replaces spaces with dashes
      .replace(/[^a-z0-9-_]/g, "")    // removes special characters
      .slice(0, 20);                  // keeps it short
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    // Simple validation before we try to save
    if (name.trim().length < 3) {
      setErrorMessage("Channel name must be at least 3 characters long");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const channelId = generateIdFromName(name);
      
      const newChannel = client.channel("messaging", channelId, {
        name: name.trim(),
        description: description.trim(),
        members: [client.user.id, ...selectedMembers],
        visibility: type,
        discoverable: type === "public",
      });

      // Actually create and start watching the channel
      await newChannel.watch();

      // Update the app state to show this new channel immediately
      setActiveChannel(newChannel);
      setSearchParams({ channel: channelId });
      
      toast.success(`Channel "#${name}" created!`);
      onClose();
    } catch (err) {
      console.error("Error creating channel", err);
      toast.error("Could not create channel. Try another name.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedMembers((prev) => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="create-channel-modal-overlay">
      <div className="create-channel-modal">
        {/* MODAL HEADER */}
        <header className="create-channel-modal__header">
          <h2 className="text-xl font-bold">New Channel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XIcon className="size-5 text-gray-400" />
          </button>
        </header>

        <form onSubmit={handleCreateChannel} className="create-channel-modal__form">
          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 border border-red-100 text-sm">
              <AlertCircleIcon className="size-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION: CHANNEL NAME */}
          <div className="form-group mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <div className="relative">
              <HashIcon className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => { setName(e.target.value); setErrorMessage(""); }}
                placeholder="e.g. general-chat"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:border-blue-500 outline-none transition-all"
                autoFocus
                maxLength={22}
              />
            </div>
            {name && <p className="text-xs text-blue-500 mt-1 font-medium italic">Final ID: #{generateIdFromName(name)}</p>}
          </div>

          {/* SECTION: VISIBILITY */}
          <div className="form-group mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-4">
              {/* PUBLIC OPTION */}
              <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${type === "public" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "bg-white"}`}>
                <input type="radio" className="hidden" checked={type === "public"} onChange={() => setType("public")} />
                <div className="flex items-center gap-3">
                  <HashIcon className="size-5 text-blue-500" />
                  <div>
                    <p className="font-bold text-sm">Public</p>
                    <p className="text-[10px] text-gray-500">Anyone can join</p>
                  </div>
                </div>
              </label>

              {/* PRIVATE OPTION */}
              <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${type === "private" ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100" : "bg-white"}`}>
                <input type="radio" className="hidden" checked={type === "private"} onChange={() => setType("private")} />
                <div className="flex items-center gap-3">
                  <LockIcon className="size-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-sm">Private</p>
                    <p className="text-[10px] text-gray-500">Invite only</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION: MEMBER SELECTION (Private only) */}
          {type === "private" && (
            <div className="form-group mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Add Members</label>
                <button type="button" onClick={() => setSelectedMembers(users.map(u => u.id))} className="text-xs text-blue-600 font-bold hover:underline">Select Everyone</button>
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-lg bg-gray-50 divide-y shadow-inner">
                {isLoadingUsers ? (
                   <p className="p-4 text-center text-xs text-gray-400">Loading directory...</p> 
                ) : users.length === 0 ? (
                   <p className="p-4 text-center text-xs text-gray-400">No users found</p>
                ) : (
                  users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white transition-colors cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedMembers.includes(user.id)} 
                        onChange={() => toggleUserSelection(user.id)} 
                      />
                      {user.image ? <img src={user.image} className="size-6 rounded-full border shadow-sm" alt="" /> : <UsersIcon className="size-6 p-1 bg-gray-200 rounded-full" />}
                      <span className="text-sm text-gray-700 group-hover:text-black">{user.name || user.id}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-right text-[10px] text-gray-400 mt-1">{selectedMembers.length} users selected</p>
            </div>
          )}

          {/* SECTION: OPTIONAL DESCRIPTION */}
          <div className="form-group mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              className="w-full p-2 border rounded-lg h-16 resize-none outline-none text-sm transition-all focus:border-gray-400"
            />
          </div>

          {/* MODAL ACTIONS */}
          <footer className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={!name.trim() || isSubmitting} 
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;