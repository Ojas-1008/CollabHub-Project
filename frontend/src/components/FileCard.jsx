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
        return { Icon: ImageIcon, bg: "bg-emerald-500/10", text: "text-emerald-600", accent: "from-emerald-500 to-teal-500" };
    }

    // --- PDFs ---
    if (mimeType.includes("pdf")) {
        return { Icon: FileTextIcon, bg: "bg-rose-500/10", text: "text-rose-600", accent: "from-rose-500 to-crimson-600" };
    }

    // --- Documents (Word / PowerPoint / Excel) ---
    if (
        mimeType.includes("word") ||
        mimeType.includes("document") ||
        mimeType.includes("presentation") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel")
    ) {
        return { Icon: FileTextIcon, bg: "bg-sky-500/10", text: "text-sky-600", accent: "from-sky-500 to-indigo-600" };
    }

    // --- Archive / Code / Data files ---
    if (
        mimeType.includes("zip") ||
        mimeType.includes("json") ||
        mimeType.includes("javascript") ||
        mimeType.includes("python") ||
        mimeType.includes("html") ||
        mimeType.includes("css") ||
        mimeType.includes("octet-stream")
    ) {
        return { Icon: FileCodeIcon, bg: "bg-amber-500/10", text: "text-amber-600", accent: "from-amber-500 to-orange-600" };
    }

    // --- Default (unknown type) ---
    return { Icon: FileIcon, bg: "bg-purple-500/10", text: "text-purple-600", accent: "from-purple-500 to-violet-600" };
};

// ─── HELPER: formatFileSize ────────────────────────────────────────────────────

/*
 * Converts raw bytes into a human-friendly string.
 */
const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── HELPER: formatDate ────────────────────────────────────────────────────────

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
    const { Icon, bg, text, accent } = getFileIcon(file.type, file.mimeType);
    const sizeLabel = formatFileSize(file.fileSize);
    const dateLabel = formatDate(file.sentAt);

    // --- HANDLERS ---

    const handleDownload = () => {
        if (file.url) {
            window.open(file.url, "_blank", "noopener,noreferrer");
        }
    };

    const handleJumpToMessage = () => {
        navigate(`/?channel=${channelId}&message=${file.messageId}`);
    };

    // --- RENDER ---

    return (
        <div className="group p-5 bg-white/40 border border-white/60 rounded-[24px] transition-all hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-purple-200/50 relative overflow-hidden">
            
            {/* TOP ROW: icon + file name + size */}
            <div className="flex items-start gap-4">

                {/* File type icon badge (Liquid Glass tile) */}
                <div className={`flex-shrink-0 size-12 ${bg} rounded-2xl flex items-center justify-center border border-white/80 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`size-6 ${text}`} />
                </div>

                {/* File name and size */}
                <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate leading-tight group-hover:text-purple-700 transition-colors" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {sizeLabel || file.type.toUpperCase()}
                    </p>
                </div>
            </div>

            {/* SENDER INFO ROW */}
            <div className="flex items-center gap-2.5 mt-4">
                {file.sender.image ? (
                    <img
                        src={file.sender.image}
                        alt={file.sender.name}
                        className="size-6 rounded-lg object-cover border border-white/80 shadow-sm flex-shrink-0"
                    />
                ) : (
                    <div className="size-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 border border-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-[10px] font-black">
                            {(file.sender.name || "?").charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12px] font-bold text-gray-700 truncate">
                        {file.sender.name}
                    </span>
                    <span className="size-1 rounded-full bg-gray-300/60" />
                    <span className="text-[12px] font-medium text-gray-500/70 flex-shrink-0">
                        {dateLabel}
                    </span>
                </div>
            </div>

            {/* ACTION BUTTONS (Glass Pill style) */}
            <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <button
                    onClick={handleDownload}
                    disabled={!file.url}
                    className="flex items-center gap-1.5 text-[10px] font-black text-purple-700 uppercase tracking-widest px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-all disabled:opacity-30"
                >
                    <DownloadIcon className="size-3.5" />
                    Download
                </button>

                <button
                    onClick={handleJumpToMessage}
                    className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 hover:text-purple-700 uppercase tracking-widest px-3.5 py-2 rounded-xl bg-gray-50/80 hover:bg-white border border-gray-100 transition-all"
                >
                    <CornerDownRightIcon className="size-3.5" />
                    Jump
                </button>
            </div>

            {/* Accent stripe on hover (Liquid highlight) */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </div>
    );
};

export default FileCard;
