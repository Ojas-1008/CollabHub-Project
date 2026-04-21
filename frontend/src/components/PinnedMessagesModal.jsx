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
        <div className="fixed inset-y-0 right-0 w-[400px] z-[100] bg-white/85 backdrop-blur-[24px] border-l border-white/60 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-300">

            {/* ── HEADER ── */}
            <div className="p-6 border-b border-purple-500/10 flex items-center justify-between">
                
                {/* Left side: icon + title + count */}
                <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <div className="size-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center border border-purple-200/50 shadow-sm">
                        <PinIcon className="size-4.5 text-purple-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Pinned Messages</h2>
                        {/* Shows how many messages are pinned */}
                        <p className="text-[10px] text-purple-600/70 font-bold uppercase tracking-widest">
                            {pinnedMessages.length} {pinnedMessages.length === 1 ? "message" : "messages"} pinned
                        </p>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="size-8 rounded-xl bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all"
                    title="Close sidebar"
                >
                    <XIcon className="size-4" />
                </button>
            </div>

            {/* ── MESSAGE LIST ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 ch-scrollbar">

                {/* EMPTY STATE: shown when no messages are pinned yet */}
                {pinnedMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="size-16 rounded-3xl bg-purple-50 border border-dashed border-purple-200 flex items-center justify-center">
                            <PinIcon className="size-8 text-purple-300" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800">No pinned messages</p>
                            <p className="text-sm font-medium text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed">
                                Hover a message and click <strong className="text-purple-600">⋯</strong> then "Pin Message" to keep it here.
                            </p>
                        </div>
                    </div>
                )}

                {/* PINNED MESSAGE CARDS */}
                {pinnedMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className="group p-4 bg-white/40 border border-white/60 rounded-2xl transition-all hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-200/50 relative overflow-hidden"
                    >
                        {/* TOP ROW: avatar + sender name + unpin button */}
                        <div className="flex items-center justify-between mb-3">

                            {/* Avatar + name */}
                            <div className="flex items-center gap-2.5">
                                {/* If user has a profile picture, show it. Otherwise show their initial letter. */}
                                {msg.user?.image ? (
                                    <img
                                        src={msg.user.image}
                                        alt={msg.user.name}
                                        className="size-8 rounded-xl object-cover border border-white/80 shadow-sm flex-shrink-0"
                                    />
                                ) : (
                                    <div className="size-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 border border-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">
                                            {(msg.user?.name || "?").charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Sender name */}
                                <span className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                    {msg.user?.name || msg.user?.id || "Unknown"}
                                </span>
                            </div>

                            {/* UNPIN button — only visible when hovering the card */}
                            {onUnpin && (
                                <button
                                    onClick={() => onUnpin(msg)}
                                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase tracking-widest transition-all px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                                    title="Unpin this message"
                                >
                                    <PinOffIcon className="size-3" />
                                    Unpin
                                </button>
                            )}
                        </div>

                        {/* MESSAGE TEXT */}
                        <p className="text-[14.5px] text-gray-600 whitespace-pre-line break-words line-clamp-4 leading-relaxed font-medium">
                            {msg.text || <span className="italic opacity-50 text-gray-400">(No text content)</span>}
                        </p>

                        {/* Subtle left border accent on hover */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
            {/* Footer removed per user request */}
        </div>
    );
}

export default PinnedMessagesSidebar;