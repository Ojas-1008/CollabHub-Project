/*
 * FileCard.jsx
 * ------------
 * A single card that represents ONE file shared in the channel.
 *
 * It shows:
 *   - A coloured icon based on the file type (PDF, image, code, etc.)
 *   - The file name and human-readable size (e.g. "1.4 MB")
 *   - Who sent it and when
 *   - A Download button (opens the file URL)
 *   - A "Jump to Message" button (scrolls the chat to where the file was shared)
 *
 * Props:
 *   file        — the file descriptor object created by useChannelFiles
 *   channelId   — needed to build the ?channel=X&message=Y URL
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import {
    FileTextIcon,   // PDF, Word docs, plain text
    ImageIcon,      // All image types
    FileCodeIcon,   // Code files (.js, .py, .json, .zip, etc.)
    FileIcon,       // Fallback for anything else
    DownloadIcon,   // Download button icon
    CornerDownRightIcon, // "Jump to message" button icon
} from "lucide-react";

import { useNavigate } from "react-router-dom";

// ─── HELPER: getFileIcon ───────────────────────────────────────────────────────

/*
 * Returns the right Lucide icon component and a background/text colour pair
 * based on the file's type and MIME type.
 *
 * We check the Stream `type` field first ("image" is reliable),
 * then fall back to checking the MIME type string.
 */
const getFileIcon = (type, mimeType = "") => {
    // --- Images ---
    if (type === "image") {
        return { Icon: ImageIcon, bg: "bg-blue-500/20", text: "text-blue-400" };
    }

    // --- PDFs ---
    if (mimeType.includes("pdf")) {
        return { Icon: FileTextIcon, bg: "bg-red-500/20", text: "text-red-400" };
    }

    // --- Word / PowerPoint / Excel documents ---
    if (
        mimeType.includes("word") ||
        mimeType.includes("document") ||
        mimeType.includes("presentation") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel")
    ) {
        return { Icon: FileTextIcon, bg: "bg-blue-500/20", text: "text-blue-400" };
    }

    // --- Code or archive files (recognised by extension in the name) ---
    if (
        mimeType.includes("zip") ||
        mimeType.includes("json") ||
        mimeType.includes("javascript") ||
        mimeType.includes("python") ||
        mimeType.includes("html") ||
        mimeType.includes("css")
    ) {
        return { Icon: FileCodeIcon, bg: "bg-green-500/20", text: "text-green-400" };
    }

    // --- Default (unknown type) ---
    return { Icon: FileIcon, bg: "bg-purple-500/20", text: "text-purple-400" };
};

// ─── HELPER: formatFileSize ────────────────────────────────────────────────────

/*
 * Converts raw bytes into a human-friendly string.
 *   204800  → "200 KB"
 *   1572864 → "1.5 MB"
 *   undefined → "" (we just don't show anything)
 */
const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── HELPER: formatDate ────────────────────────────────────────────────────────

/*
 * Shows a short date label:
 *   - "Today" if the file was shared today
 *   - "Yesterday" if it was yesterday
 *   - "Apr 15" otherwise (month + day, no year for current year)
 */
const formatDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const fileDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (fileDay.getTime() === today.getTime()) return "Today";
    if (fileDay.getTime() === yesterday.getTime()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const FileCard = ({ file, channelId }) => {
    const navigate = useNavigate();

    // Pick the right icon and colours for this file type
    const { Icon, bg, text } = getFileIcon(file.type, file.mimeType);
    const sizeLabel = formatFileSize(file.fileSize);
    const dateLabel = formatDate(file.sentAt);

    // --- HANDLERS ---

    /*
     * handleDownload
     * Opens the file's CDN URL in a new tab.
     * The browser will either display it (images, PDFs) or download it.
     */
    const handleDownload = () => {
        if (file.url) {
            window.open(file.url, "_blank", "noopener,noreferrer");
        }
    };

    /*
     * handleJumpToMessage
     * Sets the URL to ?channel=X&message=Y.
     * HomePage.jsx already reads the `channel` param to set the active channel.
     *
     * NOTE: Stream Chat's MessageList will scroll to a message if you pass
     * a `highlightedMessageId` prop. We store the messageId in the URL so
     * the parent (HomePage) can pass it down when it reads the search params.
     */
    const handleJumpToMessage = () => {
        navigate(`/?channel=${channelId}&message=${file.messageId}`);
    };

    // --- RENDER ---

    return (
        /*
         * group → Tailwind's group modifier lets child elements react to this
         *         parent being hovered (e.g. show action buttons on hover)
         */
        <div className="group p-4 bg-purple-900/20 border border-purple-500/10 rounded-2xl transition-all hover:bg-purple-900/30 hover:border-purple-500/30 shadow-sm">

            {/* TOP ROW: icon + file name + size */}
            <div className="flex items-start gap-3">

                {/* File type icon badge */}
                <div className={`flex-shrink-0 w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`size-5 ${text}`} />
                </div>

                {/* File name and size */}
                <div className="flex-1 min-w-0">
                    {/*
                     * truncate → clips long file names with "..." instead of
                     *            breaking onto a second line
                     */}
                    <p className="text-sm font-semibold text-white truncate" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-[11px] text-purple-400/70 mt-0.5">
                        {/* Show size if available, otherwise just show the type */}
                        {sizeLabel || file.type.toUpperCase()}
                    </p>
                </div>
            </div>

            {/* SENDER INFO ROW */}
            <div className="flex items-center gap-2 mt-3">
                {/* Sender avatar — photo if available, initial letter otherwise */}
                {file.sender.image ? (
                    <img
                        src={file.sender.image}
                        alt={file.sender.name}
                        className="w-5 h-5 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                    />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-500/40 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[9px] font-bold">
                            {(file.sender.name).charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Sender name + date */}
                <span className="text-[11px] text-purple-300/70 truncate">
                    {file.sender.name}
                </span>
                <span className="text-[11px] text-purple-400/40">·</span>
                <span className="text-[11px] text-purple-400/50 flex-shrink-0">
                    {dateLabel}
                </span>
            </div>

            {/* ACTION BUTTONS ROW
                These are hidden by default and only appear when hovering the card.
                `opacity-0 group-hover:opacity-100` is the Tailwind trick for this. */}
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200">

                {/* DOWNLOAD BUTTON */}
                <button
                    onClick={handleDownload}
                    disabled={!file.url}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-white uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Download file"
                >
                    <DownloadIcon className="size-3" />
                    Download
                </button>

                {/* JUMP TO MESSAGE BUTTON */}
                <button
                    onClick={handleJumpToMessage}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-white uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 transition-colors"
                    title="Go to the message where this file was shared"
                >
                    <CornerDownRightIcon className="size-3" />
                    Jump
                </button>
            </div>
        </div>
    );
};

export default FileCard;
