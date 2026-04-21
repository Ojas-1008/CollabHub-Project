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
        <div className="fixed inset-y-0 right-0 w-[480px] z-[100] bg-white/85 backdrop-blur-[24px] border-l border-white/60 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-300">

            {/* ── HEADER ── */}
            <div className="p-6 border-b border-purple-500/10 flex items-center justify-between">

                {/* Left side: icon badge + title + file count */}
                <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <div className="size-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center border border-purple-200/50 shadow-sm">
                        <FolderOpenIcon className="size-4.5 text-purple-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Shared Files</h2>
                        {/* File count badge — updates as files load */}
                        <p className="text-[10px] text-purple-600/70 font-bold uppercase tracking-widest">
                            {files.length} {files.length === 1 ? "file" : "files"} in this channel
                        </p>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="size-8 rounded-xl bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all"
                    title="Close file explorer"
                >
                    <XIcon className="size-4" />
                </button>
            </div>

            {/* ── FILTER TABS ── */}
            <div className="px-6 pt-5 pb-2 flex flex-wrap items-center gap-2 flex-shrink-0">
                {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    const { Icon } = filter;

                    return (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11.5px] font-bold uppercase tracking-widest transition-all
                                ${isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                    : "bg-white/60 text-gray-500 hover:text-purple-700 hover:bg-purple-50 border border-white/80"
                                }`}
                        >
                            <Icon className="size-3.5" />
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/* ── FILE LIST ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 ch-scrollbar">

                {/* LOADING STATE: shown during the first fetch */}
                {isLoading && files.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <Loader2Icon className="size-8 text-purple-600 animate-spin" />
                        <p className="text-sm text-gray-500 font-medium">Fetching files...</p>
                    </div>
                )}

                {/* EMPTY STATE: shown after loading if no files exist, or none match the filter */}
                {!isLoading && visibleFiles.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="size-16 rounded-3xl bg-purple-50 border border-dashed border-purple-200 flex items-center justify-center">
                            <FolderIcon className="size-8 text-purple-300" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800">
                                {activeFilter === "all"
                                    ? "No files shared yet"
                                    : `No ${currentFilter.label.toLowerCase()} found`}
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-1 max-w-[300px] mx-auto leading-relaxed">
                                {activeFilter === "all"
                                    ? "Attach a file to any message and it will appear here."
                                    : "Try switching to the \"All\" tab to see every file."}
                            </p>
                        </div>
                    </div>
                )}

                {/* FILE CARDS */}
                {/* We use grid to make the cards fit nicely in the wider 480px sidebar layout */}
                {visibleFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                        {visibleFiles.map((file) => (
                            <div className="group relative overflow-hidden bg-white/40 border border-white/60 rounded-2xl transition-all hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-200/50" key={file.id}>
                                <FileCard
                                    file={file}
                                    channelId={channel.id}
                                />
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}

                {/* LOAD MORE BUTTON */}
                {hasMore && files.length > 0 && (
                    <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full mt-4 py-3 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-purple-700 bg-purple-100/50 hover:bg-purple-100 border border-purple-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2Icon className="size-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More Files"
                        )}
                    </button>
                )}
            </div>
            
            {/* Footer removed per user request */}
        </div>
    );
};

export default FileExplorer;
