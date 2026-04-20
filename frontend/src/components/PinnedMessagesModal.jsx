/*
 * PinnedMessagesModal.jsx
 * -----------------------
 * A read-only popup that shows every message pinned in the active channel.
 * It is opened by the pin (📌) button in CustomChannelHeader.
 *
 * The list of pinned messages is fetched by the parent (CustomChannelHeader)
 * via channel.query() and passed down as a prop, so this component only
 * needs to display them — it doesn't fetch anything on its own.
 *
 * Props:
 *   - pinnedMessages : Array of Stream message objects that have been pinned.
 *                      Each object has at least: { id, text, user: { name, image } }
 *   - onClose        : Function to call when the user wants to close this modal.
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// XIcon renders the ✕ close button icon
import { XIcon } from "lucide-react";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function PinnedMessagesModal({ pinnedMessages, onClose }) {
    return (
        // Full-screen semi-transparent backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

            {/* Modal card */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">

                {/* HEADER: Title + close button */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-2xl font-semibold">Pinned Messages</h2>
                    <button
                        onClick={onClose}
                        className="text-2xl text-gray-500 hover:text-gray-700"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/*
                 * MESSAGES LIST
                 * max-h-96 + overflow-y-auto: scrollable if there are many pinned messages,
                 * so the modal never grows taller than the viewport.
                 */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">

                    {/* EMPTY STATE: shown when there are no pinned messages yet */}
                    {pinnedMessages.length === 0 && (
                        <div className="text-center text-gray-500 py-8">No pinned messages</div>
                    )}

                    {/* MESSAGE ROWS: rendered only if there is at least one pinned message */}
                    {pinnedMessages.map((msg) => (
                        /*
                         * Each row shows:
                         *   - The sender's avatar (photo or initial letter)
                         *   - Their name
                         *   - The pinned message text
                         *
                         * key={msg.id} is required by React to efficiently update the list
                         * when the array changes.
                         */
                        <div
                            key={msg.id}
                            className="flex items-start gap-3 py-4 border-b last:border-b-0"
                        >
                            {/* AVATAR — photo if the user has one, fallback initial letter otherwise */}
                            {msg.user?.image ? (
                                <img
                                    src={msg.user.image}
                                    alt={msg.user.name}
                                    className="w-9 h-9 rounded-full object-cover mt-1 flex-shrink-0"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center mt-1 flex-shrink-0">
                                    <span className="text-white text-sm font-bold">
                                        {(msg.user?.name || "?").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/*
                             * MESSAGE META + TEXT
                             * We wrap them in a column so the name sits above the message text.
                             * min-w-0 prevents long words from overflowing the container.
                             */}
                            <div className="min-w-0">
                                {/* Sender name */}
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                    {msg.user?.name || msg.user?.id}
                                </div>

                                {/*
                                 * Message text
                                 * whitespace-pre-line preserves intentional line breaks in the message
                                 * (e.g. if the user pressed Enter while typing).
                                 */}
                                <div className="text-base text-gray-900 whitespace-pre-line break-words">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PinnedMessagesModal;