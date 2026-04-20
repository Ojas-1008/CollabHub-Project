/*
 * PinnedMessagesModal.jsx
 * -----------------------
 * A SIDEBAR (slide-in from the right) that shows every pinned message
 * in the active channel.
 *
 * It is opened by the 📌 pin button in CustomChannelHeader.
 *
 * The list of pinned messages is fetched by the parent (CustomChannelHeader)
 * via channel.query() and passed down as a prop, so this component only
 * needs to DISPLAY them — it doesn't fetch anything on its own.
 *
 * Props:
 *   - pinnedMessages : Array of Stream message objects that have been pinned.
 *                      Each object has at least: { id, text, user: { name, image } }
 *   - onClose        : Function called when the user wants to close this sidebar.
 *   - onUnpin        : Function called when the user clicks "Unpin" on a message.
 *                      The parent will handle the actual API call.
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// XIcon = the ✕ close button | PinIcon = decorative icon in the header
import { XIcon, PinIcon, PinOffIcon } from "lucide-react";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function PinnedMessagesSidebar({ pinnedMessages, onClose, onUnpin }) {
    return (
        /*
         * SIDEBAR CONTAINER
         * -----------------
         * fixed         → stays in place even when the page scrolls
         * inset-y-0     → stretches from top to bottom of the screen
         * right-0       → anchored to the RIGHT edge of the screen
         * w-[380px]     → fixed width (same as TaskListDrawer)
         * z-[100]       → appears above the chat content but not above modals
         *
         * The glassmorphic style uses:
         *   bg-purple-950/40   → dark purple with 40% opacity (see-through)
         *   backdrop-blur-2xl  → blurs everything behind it
         *   border-l           → thin left border to separate from the chat
         */
        <div className="fixed inset-y-0 right-0 w-[380px] z-[100] bg-purple-950/40 backdrop-blur-2xl border-l border-purple-500/20 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* ── HEADER ── */}
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-l from-purple-900/40 to-transparent">
                
                {/* Left side: icon + title + count */}
                <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <PinIcon className="size-5 text-purple-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Pinned Messages</h2>
                        {/* Shows how many messages are pinned */}
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                            {pinnedMessages.length} {pinnedMessages.length === 1 ? "message" : "messages"} pinned
                        </p>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-purple-300"
                    title="Close sidebar"
                >
                    <XIcon className="size-5" />
                </button>
            </div>

            {/* ── MESSAGE LIST ── */}
            {/*
             * flex-1          → takes up all remaining vertical space
             * overflow-y-auto → scrollable if there are many pinned messages
             * p-6 space-y-4   → padding + spacing between message cards
             */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* EMPTY STATE: shown when no messages are pinned yet */}
                {pinnedMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 mt-12">
                        <PinIcon className="size-12 text-purple-400" />
                        <div>
                            <p className="text-lg font-bold text-white">No pinned messages</p>
                            <p className="text-xs text-purple-200 mt-1">
                                Hover a message and click ⋯ then "Pin Message" to pin it here.
                            </p>
                        </div>
                    </div>
                )}

                {/* PINNED MESSAGE CARDS */}
                {pinnedMessages.map((msg) => (
                    /*
                     * Each card is a small self-contained box showing:
                     *   - The sender's avatar (photo or initial letter as fallback)
                     *   - Sender's name
                     *   - The message text
                     *   - An "Unpin" button
                     *
                     * key={msg.id} → React uses this to track which card is which
                     *                when the list updates (required for .map())
                     */
                    <div
                        key={msg.id}
                        className="group p-4 bg-purple-900/20 border border-purple-500/10 rounded-2xl transition-all hover:bg-purple-900/30 hover:border-purple-500/30 shadow-sm"
                    >
                        {/* TOP ROW: avatar + sender name + unpin button */}
                        <div className="flex items-center justify-between mb-2">

                            {/* Avatar + name */}
                            <div className="flex items-center gap-2">
                                {/* If user has a profile picture, show it. Otherwise show their initial letter. */}
                                {msg.user?.image ? (
                                    <img
                                        src={msg.user.image}
                                        alt={msg.user.name}
                                        className="w-7 h-7 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-purple-500/40 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">
                                            {/* .charAt(0) gets the first letter; .toUpperCase() makes it CAPITAL */}
                                            {(msg.user?.name || "?").charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Sender name */}
                                <span className="text-sm font-semibold text-purple-100">
                                    {msg.user?.name || msg.user?.id || "Unknown"}
                                </span>
                            </div>

                            {/* UNPIN button — only visible when hovering the card */}
                            {onUnpin && (
                                <button
                                    onClick={() => onUnpin(msg)}
                                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-red-400 uppercase tracking-widest transition-all px-2 py-1 rounded-full hover:bg-red-400/10"
                                    title="Unpin this message"
                                >
                                    <PinOffIcon className="size-3" />
                                    Unpin
                                </button>
                            )}
                        </div>

                        {/* MESSAGE TEXT */}
                        {/*
                         * whitespace-pre-line: preserves intentional line breaks the user typed
                         * break-words: stops very long words from overflowing the card
                         * line-clamp-4: limits display to 4 lines (no infinitely tall cards)
                         */}
                        <p className="text-sm text-purple-100/80 whitespace-pre-line break-words line-clamp-4 leading-relaxed">
                            {msg.text || <span className="italic opacity-50">(No text content)</span>}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── FOOTER ── */}
            <div className="p-4 bg-purple-950/20 border-t border-purple-500/10">
                <p className="text-[9px] text-center text-purple-400/60 uppercase font-bold tracking-tighter">
                    CollabHub Pinned Messages • Pin important info for your team
                </p>
            </div>
        </div>
    );
}

export default PinnedMessagesSidebar;