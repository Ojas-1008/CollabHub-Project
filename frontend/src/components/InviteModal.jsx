/*
 * InviteModal.jsx
 * ---------------
 * This popup lets users of a PRIVATE channel invite other people to join.
 * It fetches all users on the platform who are NOT already members,
 * lets the current user select one or more of them via checkboxes,
 * and calls channel.addMembers() to add them when the "Invite" button is clicked.
 *
 * Props:
 *   - channel  : The Stream Channel object for the currently active channel.
 *   - onClose  : Function to call when the modal should close (clears the overlay).
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// useEffect — runs code after the component first renders (used to fetch users).
// useState  — creates reactive variables that trigger re-renders when updated.
import { useEffect, useState } from "react";

// useChatContext gives us access to the Stream Chat `client`.
// The client is our connection to the Stream backend — we use it to query users.
import { useChatContext } from "stream-chat-react";

// XIcon is the ✕ close button icon from lucide-react
import { XIcon } from "lucide-react";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const InviteModal = ({ channel, onClose }) => {
    // Step 1 — Get the Stream Chat client from context.
    // `client` has methods like client.queryUsers() to search for users.
    const { client } = useChatContext();

    // Step 2 — Local state for this component.

    // `users` — the list of all platform users who are NOT already in this channel
    const [users, setUsers] = useState([]);

    // `selectedMembers` — array of user IDs the admin has ticked (checked) so far
    const [selectedMembers, setSelectedMembers] = useState([]);

    // `isLoadingUsers` — true while we're waiting for the API to return the user list
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    // `error` — a human-readable error string; empty string means no error
    const [error, setError] = useState("");

    // `isInviting` — true while the invite API call is in-flight (prevents double clicks)
    const [isInviting, setIsInviting] = useState(false);

    // ── SIDE EFFECT: Fetch eligible users when the modal first opens ──────────

    /*
     * useEffect with [channel, client] as the dependency array means this runs:
     *   - Once right after the component mounts (appears on screen)
     *   - Again any time `channel` or `client` changes (which in practice never happens)
     *
     * We keep the async logic inside a named inner function (fetchUsers) because
     * useEffect's callback cannot itself be async.
     */
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingUsers(true);
            setError(""); // clear any previous error

            try {
                // Get the IDs of people already in the channel so we can exclude them.
                // channel.state.members is an object: { userId: memberObject, ... }
                const existingMemberIds = Object.keys(channel.state.members);

                // Query Stream for users whose IDs are NOT in the existing members list.
                // $nin means "not in" — a MongoDB-style filter that Stream understands.
                // The second argument { name: 1 } sorts results alphabetically by name.
                // The third argument limits results to 30 users maximum.
                const response = await client.queryUsers(
                    { id: { $nin: existingMemberIds } },
                    { name: 1 },
                    { limit: 30 }
                );

                setUsers(response.users);
            } catch (err) {
                console.log("Error fetching users", err);
                setError("Failed to load users");
            } finally {
                // Always turn off the loading spinner, whether it succeeded or failed
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [channel, client]);

    // ── HANDLER: Invite selected members ─────────────────────────────────────

    /*
     * handleInvite is called when the user clicks the "Invite" button.
     * It uses channel.addMembers() — a Stream SDK method — to add each selected
     * user to the channel. Stream handles the real-time notification to those users.
     */
    const handleInvite = async () => {
        // Guard: do nothing if nobody has been selected
        if (selectedMembers.length === 0) return;

        setIsInviting(true);
        setError("");

        try {
            // Stream's addMembers() accepts an array of user ID strings.
            // It updates the channel on the server and notifies the new members.
            await channel.addMembers(selectedMembers);

            // Close the modal after a successful invite
            onClose();
        } catch (err) {
            setError("Failed to invite users");
            console.log("Error inviting users:", err);
        } finally {
            setIsInviting(false);
        }
    };

    // ── HANDLER: Toggle a user's checkbox ────────────────────────────────────

    /*
     * When a checkbox changes we either add or remove the user ID from
     * the selectedMembers array, depending on whether it's being checked or unchecked.
     */
    const handleToggleMember = (userId, isChecked) => {
        if (isChecked) {
            // Add this user ID to the selection list
            setSelectedMembers([...selectedMembers, userId]);
        } else {
            // Remove this user ID from the selection list
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        // Full-screen dark overlay — clicking outside does NOT close it (intentional)
        <div className="create-channel-modal-overlay">

            {/* Modal card */}
            <div className="create-channel-modal">

                {/* HEADER: Title + close button */}
                <div className="create-channel-modal__header">
                    <h2>Invite Users</h2>
                    <button onClick={onClose} className="create-channel-modal__close">
                        <XIcon className="size-4" />
                    </button>
                </div>

                {/* BODY: Loading state, error, empty state, or user list */}
                <div className="create-channel-modal__form">

                    {/* Loading spinner text */}
                    {isLoadingUsers && <p>Loading users...</p>}

                    {/* Error message (only visible if something went wrong) */}
                    {error && <p className="form-error">{error}</p>}

                    {/* Empty state: shown when fetch succeeds but returns zero results */}
                    {users.length === 0 && !isLoadingUsers && <p>No users found</p>}

                    {/* USER LIST: one checkbox row per eligible user */}
                    {users.length > 0 &&
                        users.map((user) => {
                            // Is this particular user already ticked?
                            const isChecked = selectedMembers.includes(user.id);

                            return (
                                /*
                                 * We wrap the whole row in a <label> so clicking anywhere on
                                 * the row (avatar, name, or the checkbox itself) toggles it.
                                 * The dynamic class string adds a purple border when checked.
                                 */
                                <label
                                    key={user.id}
                                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all shadow-sm bg-white hover:bg-[#f5f3ff] border-2 ${
                                        isChecked ? "border-[#611f69] bg-[#f3e6fa]" : "border-gray-200"
                                    }`}
                                >
                                    {/* Hidden checkbox — the label toggle drives it */}
                                    <input
                                        type="checkbox"
                                        className="checkbox checbox-primay checkbox-sm accent-[#611f69]"
                                        value={user.id}
                                        checked={isChecked}
                                        onChange={(e) => handleToggleMember(user.id, e.target.checked)}
                                    />

                                    {/* User avatar: photo if available, falling back to initial letter */}
                                    {user.image ? (
                                        <img
                                            src={user.image}
                                            alt={user.name}
                                            className="size-9 rounded-full object-cover border border-gray-300"
                                        />
                                    ) : (
                                        <div className="size-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
                                            {/* Show the first letter of their name (or ID as fallback) */}
                                            {(user.name || user.id).charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* User display name */}
                                    <span className="font-medium text-[#611f69] text-base">
                                        {user.name || user.id}
                                    </span>
                                </label>
                            );
                        })}

                    {/* ACTIONS: Cancel and Invite buttons */}
                    <div className="create-channel-modal__actions mt-4">
                        {/* Cancel closes the modal without doing anything */}
                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isInviting}
                        >
                            Cancel
                        </button>

                        {/* Invite is disabled if nothing is selected OR the API call is running */}
                        <button
                            className="btn btn-primary"
                            onClick={handleInvite}
                            disabled={!selectedMembers.length || isInviting}
                        >
                            {/* Change button text while the invite is in-flight */}
                            {isInviting ? "Inviting..." : "Invite"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;