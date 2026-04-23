import { XIcon, SparklesIcon } from "lucide-react";

/**
 * ✨ SUMMARY MODAL — Displays the AI-Generated Conversation Summary
 *
 * This is a slide-in sidebar (drawer) that shows the AI summary.
 * It matches the same glassmorphic "drawer" pattern used by
 * PinnedMessagesModal, TaskListDrawer, and FileExplorer.
 *
 * PROPS:
 *  - summary:    The AI-generated summary text (string with bullet points).
 *  - isLoading:  Whether the AI is still generating the summary.
 *  - onClose:    Function to close this modal.
 */

const SummaryModal = ({ summary, isLoading, onClose }) => {
    return (
        // ── BACKDROP: Covers the screen behind the drawer ──
        <div
            className="fixed inset-0 z-[100] flex justify-end"
            onClick={onClose}
        >
            {/* Semi-transparent dark overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* ── THE DRAWER PANEL ── */}
            <div
                className="relative w-[420px] max-w-full h-full bg-purple-950/40 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-slideIn"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {/* AI Sparkle Icon with gradient background */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-[15px] tracking-tight">
                                AI Summary
                            </h2>
                            <p className="text-[11px] text-purple-300/60 font-medium">
                                Powered by Cerebras
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* ── CONTENT AREA ── */}
                <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        // ── LOADING STATE ──
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            {/* Pulsing AI icon */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center animate-pulse">
                                <SparklesIcon className="w-8 h-8 text-purple-300/70" />
                            </div>
                            <div className="text-center">
                                <p className="text-white/80 font-semibold text-sm">
                                    Reading your messages...
                                </p>
                                <p className="text-purple-300/50 text-xs mt-1">
                                    AI is analyzing the conversation
                                </p>
                            </div>
                        </div>
                    ) : summary ? (
                        // ── SUMMARY RESULT ──
                        <div className="space-y-4">
                            {/* The summary text — rendered as a styled card */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                                    {summary}
                                </p>
                            </div>

                            {/* Footer note */}
                            <p className="text-[11px] text-purple-300/40 text-center px-4">
                                Summary generated from the last messages in this channel.
                                AI responses may not always be accurate.
                            </p>
                        </div>
                    ) : (
                        // ── ERROR / EMPTY STATE ──
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <p className="text-white/50 text-sm font-medium">
                                No summary available
                            </p>
                            <p className="text-purple-300/40 text-xs text-center max-w-[250px]">
                                Click the ✨ Summarize button in the channel header to generate one.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;
