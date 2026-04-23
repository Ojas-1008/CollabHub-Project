import { XIcon, SparklesIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
                className="relative w-[420px] max-w-full h-full bg-white/85 backdrop-blur-[24px] border-l border-white/60 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col animate-slideIn"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between p-6 border-b border-purple-500/10">
                    <div className="flex items-center gap-3">
                        {/* AI Sparkle Icon with gradient background */}
                        <div className="size-10 bg-gradient-to-br from-fuchsia-100 to-purple-50 rounded-xl flex items-center justify-center border border-purple-200/50 shadow-sm">
                            <SparklesIcon className="size-4.5 text-fuchsia-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                AI Summary
                            </h2>
                            <p className="text-[10px] text-fuchsia-600/70 font-bold uppercase tracking-widest">
                                Powered by Cerebras
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="size-8 rounded-xl bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all"
                    >
                        <XIcon className="size-4" />
                    </button>
                </div>

                {/* ── CONTENT AREA ── */}
                <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        // ── LOADING STATE ──
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            {/* Pulsing AI icon */}
                            <div className="size-16 rounded-3xl bg-fuchsia-50 border border-dashed border-fuchsia-200 flex items-center justify-center animate-pulse">
                                <SparklesIcon className="size-8 text-fuchsia-400" />
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-gray-800 font-bold text-lg">
                                    Reading your messages...
                                </p>
                                <p className="text-sm font-medium text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed">
                                    AI is analyzing the conversation
                                </p>
                            </div>
                        </div>
                    ) : summary ? (
                        // ── SUMMARY RESULT ──
                        <div className="space-y-6">
                            {/* The summary text — rendered as a styled card */}
                            <div className="bg-white/40 border border-white/60 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                                <ReactMarkdown
                                    components={{
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-3" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-3" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-gray-700 font-medium text-[14.5px] leading-relaxed" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-700 font-medium text-[14.5px] leading-relaxed mb-3 last:mb-0" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-gray-900 mb-2 mt-4" {...props} />,
                                        h4: ({ node, ...props }) => <h4 className="text-[13px] font-bold text-gray-900 mb-1 mt-3" {...props} />,
                                    }}
                                >
                                    {summary}
                                </ReactMarkdown>
                            </div>

                            {/* Footer note */}
                            <p className="text-[11px] text-gray-400 font-medium text-center px-4">
                                Summary generated from the last messages in this channel.
                                AI responses may not always be accurate.
                            </p>
                        </div>
                    ) : (
                        // ── ERROR / EMPTY STATE ──
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <p className="text-gray-800 font-bold text-lg">
                                No summary available
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed text-center">
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
