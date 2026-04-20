/*
 * MembersModal.jsx
 * ----------------
 * A read-only popup that lists every member currently in the active channel.
 * It is opened by the member-count button in CustomChannelHeader.
 *
 * Props:
 *   - members  : Array of Stream member objects (from Object.values(channel.state.members)).
 *                Each object looks like: { user: { id, name, image, ... }, role, ... }
 *   - onClose  : Function to call when the user wants to close this modal.
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// XIcon renders the ✕ close button icon
import { XIcon } from "lucide-react";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function MembersModal({ members, onClose }) {
    return (
        // Full-screen semi-transparent backdrop — clicking it does NOT close the modal
        // (the close button is the only exit, which keeps it predictable for new users)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

            {/* Modal card */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">

                {/* HEADER: Title + close button */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-2xl font-semibold">Channel Members</h2>
                    <button
                        onClick={onClose}
                        className="text-2xl text-gray-500 hover:text-gray-700"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/*
                 * MEMBERS LIST
                 * max-h-96 + overflow-y-auto: the list scrolls if there are many members,
                 * instead of making the modal grow infinitely tall.
                 */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    {members.map((member) => {
                        // Pull the nested user object out for easier access below
                        const { user } = member;

                        // Compute the fallback initial letter once, so it's readable
                        const initialLetter = (user.name || user.id).charAt(0).toUpperCase();

                        return (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-b-0"
                            >
                                {/* AVATAR: real photo if available, otherwise a grey circle with initial */}
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="size-9 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="size-9 rounded-full bg-gray-400 flex items-center justify-center">
                                        <span className="text-white">{initialLetter}</span>
                                    </div>
                                )}

                                {/* DISPLAY NAME: fall back to user ID if name is not set */}
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                    {user.name || user.id}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MembersModal;