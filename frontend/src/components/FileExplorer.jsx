/*
 * FileExplorer.jsx
 * ----------------
 * The main "Shared File Explorer" panel.
 *
 * This is a slide-in sidebar (from the right) that lets users browse
 * all files ever shared in the current channel — without scrolling through chat.
 *
 * Features:
 *   - Filter tabs: All | Images | Documents | Links
 *   - A count badge showing how many files are in the channel
 *   - Infinite-scroll pagination via a "Load More" button
 *   - A clean empty state if no files have been shared
 *   - A loading spinner while the first fetch runs
 *
 * This component follows the exact same visual style and structure as:
 *   - PinnedMessagesModal.jsx  (glassy sidebar, same header style)
 *   - TaskListDrawer.jsx       (same footer, same loading pattern)
 *
 * Props:
 *   onClose  — called when the user clicks the ✕ button
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import { useState } from "react";

import {
    XIcon,          // Close button
    FolderOpenIcon, // Header icon
    Loader2Icon,    // Spinning loader
    FolderIcon,     // Empty state illustration
    ImageIcon,      // Images filter tab icon
    FileTextIcon,   // Documents filter tab icon
    LinkIcon,       // Links filter tab icon
    LayoutGridIcon, // All filter tab icon
} from "lucide-react";

// The hook that fetches files from Stream
import { useChannelFiles } from "../hooks/useChannelFiles";

// The individual file card
import FileCard from "./FileCard";

// We need the current channel to pass to the hook
import { useChannelStateContext } from "stream-chat-react";

// ─── FILTER DEFINITIONS ───────────────────────────────────────────────────────

/*
 * Each filter has:
 *   id     — used as a React key and to identify which tab is active
 *   label  — text shown in the tab button
 *   Icon   — Lucide icon for the tab
 *   test   — a function that returns true if a file should be shown under this filter
 */
const FILTERS = [
    {
        id: "all",
        label: "All",
        Icon: LayoutGridIcon,
        // "All" shows everything — always returns true
        test: () => true,
    },
    {
        id: "images",
        label: "Images",
        Icon: ImageIcon,
        // Show only files whose Stream type is "image"
        test: (file) => file.type === "image",
    },
    {
        id: "documents",
        label: "Docs",
        Icon: FileTextIcon,
        // Show PDFs and common document MIME types
        test: (file) =>
            file.mimeType.includes("pdf") ||
            file.mimeType.includes("word") ||
            file.mimeType.includes("document") ||
            file.mimeType.includes("presentation") ||
            file.mimeType.includes("spreadsheet"),
    },
    {
        id: "links",
        label: "Links",
        Icon: LinkIcon,
        // Stream stores ogScraping/link-preview attachments with type "image" and a
        // title_link. We check for attachments that have an og_scrape_url or a URL
        // but whose type is not "image" or "file" in the traditional sense.
        // A simpler heuristic: type === "video" or there's no file_size and there is a url
        test: (file) =>
            file.type !== "image" &&
            file.type !== "file" &&
            file.url !== "",
    },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const FileExplorer = ({ onClose }) => {
    // Get the active channel from Stream's context
    // (same pattern used in TaskListDrawer and PinnedMessagesModal)
    const { channel } = useChannelStateContext();

    // Pass the channel to our custom hook to get the file list
    const { files, isLoading, hasMore, loadMore } = useChannelFiles(channel);

    // Which filter tab is currently selected (default: "all")
    const [activeFilter, setActiveFilter] = useState("all");

    // --- FILTERING ---

    /*
     * Find the currently active filter object from our FILTERS array.
     * Then apply its test() function to our file list.
     * This gives us only the files that match the current tab.
     */
    const currentFilter = FILTERS.find((f) => f.id === activeFilter);
    const visibleFiles = files.filter(currentFilter.test);

    // --- RENDER ---

    return (
        /*
         * OUTER CONTAINER
         * ---------------
         * The exact same glassy sidebar style as PinnedMessagesModal and TaskListDrawer:
         *   fixed inset-y-0 right-0  → sticks to the full right side of the screen
         *   w-[400px]                → same fixed width as TaskListDrawer
         *   z-[100]                  → sits above chat content
         *   backdrop-blur-2xl        → blurs everything behind the panel
         *   animate-in slide-in-from-right → slides in from the right on mount
         */
        <div className="fixed inset-y-0 right-0 w-[400px] z-[100] bg-purple-950/40 backdrop-blur-2xl border-l border-purple-500/20 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* ── HEADER ── */}
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-l from-purple-900/40 to-transparent">

                {/* Left side: icon badge + title + file count */}
                <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <FolderOpenIcon className="size-5 text-purple-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Shared Files</h2>
                        {/* File count badge — updates as files load */}
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                            {files.length} {files.length === 1 ? "file" : "files"} in this channel
                        </p>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-purple-300"
                    title="Close file explorer"
                >
                    <XIcon className="size-5" />
                </button>
            </div>

            {/* ── FILTER TABS ── */}
            {/*
             * A horizontal row of filter buttons.
             * The active one gets a filled purple background; inactive ones are subtle.
             */}
            <div className="px-4 pt-4 pb-0 flex items-center gap-2 flex-shrink-0">
                {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    const { Icon } = filter;

                    return (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all
                                ${isActive
                                    // Active: filled purple pill
                                    ? "bg-purple-500/30 text-white border border-purple-500/50"
                                    // Inactive: transparent, dimmer text
                                    : "text-purple-400/60 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent"
                                }`}
                        >
                            <Icon className="size-3" />
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/* ── FILE LIST ── */}
            {/*
             * flex-1          → takes all remaining vertical space
             * overflow-y-auto → scrollable when there are many files
             * p-4 space-y-3   → padding + gaps between cards
             */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* LOADING STATE: shown during the first fetch */}
                {isLoading && files.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                        <Loader2Icon className="size-8 text-purple-400 animate-spin" />
                        <p className="text-sm text-purple-300 font-medium">Fetching files...</p>
                    </div>
                )}

                {/* EMPTY STATE: shown after loading if no files exist, or none match the filter */}
                {!isLoading && visibleFiles.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 mt-12">
                        <FolderIcon className="size-12 text-purple-400" />
                        <div>
                            <p className="text-lg font-bold text-white">
                                {/* Different message depending on whether a filter is active */}
                                {activeFilter === "all"
                                    ? "No files shared yet"
                                    : `No ${currentFilter.label.toLowerCase()} found`}
                            </p>
                            <p className="text-xs text-purple-200 mt-1">
                                {activeFilter === "all"
                                    ? "Attach a file to any message and it will appear here."
                                    : "Try switching to the \"All\" tab to see every file."}
                            </p>
                        </div>
                    </div>
                )}

                {/* FILE CARDS */}
                {visibleFiles.map((file) => (
                    /*
                     * We pass the channel.id so FileCard can build the
                     * ?channel=X&message=Y link for the "Jump to Message" button.
                     */
                    <FileCard
                        key={file.id}
                        file={file}
                        channelId={channel.id}
                    />
                ))}

                {/* LOAD MORE BUTTON
                    Only shown when there are more pages AND the initial load is done */}
                {hasMore && files.length > 0 && (
                    <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full mt-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {/* Show spinner inside the button while loading the next page */}
                        {isLoading ? (
                            <>
                                <Loader2Icon className="size-3 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More Files"
                        )}
                    </button>
                )}
            </div>

            {/* ── FOOTER ── */}
            {/* Matches the footer style in TaskListDrawer and PinnedMessagesModal */}
            <div className="p-4 bg-purple-950/20 border-t border-purple-500/10">
                <p className="text-[9px] text-center text-purple-400/60 uppercase font-bold tracking-tighter">
                    CollabHub File Explorer • All channel attachments in one place
                </p>
            </div>
        </div>
    );
};

export default FileExplorer;
