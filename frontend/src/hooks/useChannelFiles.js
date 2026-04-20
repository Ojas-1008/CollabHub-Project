/*
 * useChannelFiles.js
 * ------------------
 * A custom React hook that fetches all files (attachments) shared in a
 * given Stream Chat channel.
 *
 * How it works:
 *   1. You pass it the current Stream `channel` object.
 *   2. It queries Stream for messages that have at least one attachment.
 *   3. It "flattens" those messages into a simple list of file objects,
 *      each one enriched with who sent it and when.
 *   4. It supports pagination — loading more files 20 at a time —
 *      so we never dump thousands of items at once.
 *
 * What it returns:
 *   { files, isLoading, hasMore, loadMore }
 */

import { useState, useEffect, useCallback } from "react";

// How many messages to fetch per "page"
const PAGE_SIZE = 20;

export const useChannelFiles = (channel) => {
    // --- STATE ---

    // The flat list of file objects we show in the UI
    const [files, setFiles] = useState([]);

    // True while the first fetch (or a "load more" fetch) is in progress
    const [isLoading, setIsLoading] = useState(false);

    // The offset (how many messages we've already fetched) for pagination
    const [offset, setOffset] = useState(0);

    // Whether there might be more messages to load
    // (we assume true until a page comes back with fewer items than PAGE_SIZE)
    const [hasMore, setHasMore] = useState(true);

    // --- HELPERS ---

    /*
     * extractFiles(messages)
     * ----------------------
     * Takes an array of Stream message objects and returns a flat list of
     * file descriptors. One message can have MULTIPLE attachments, so we
     * loop over each message and then over each attachment inside it.
     *
     * Each returned item looks like:
     * {
     *   id:          "<messageId>-<attachmentIndex>"  ← unique key for React
     *   messageId:   "abc123"                         ← used for "Jump to message"
     *   name:        "report.pdf"
     *   url:         "https://cdn.stream.io/..."
     *   type:        "image" | "file" | "video" | etc.
     *   mimeType:    "application/pdf"
     *   fileSize:    204800                           ← bytes (may be undefined)
     *   sender:      { name: "Alice", image: "..." }
     *   sentAt:      Date object
     * }
     */
    const extractFiles = (messages) => {
        const result = [];

        for (const message of messages) {
            // Skip messages with no attachments (safety check)
            if (!message.attachments || message.attachments.length === 0) continue;

            message.attachments.forEach((attachment, index) => {
                // Skip "giphy" or "link-preview" type attachments — those are not real files
                if (attachment.type === "giphy") return;

                result.push({
                    // Unique key: combine message ID + attachment index
                    id: `${message.id}-${index}`,

                    // We store the message ID so the "Jump to Message" button can navigate to it
                    messageId: message.id,

                    // The human-readable file name (Stream stores it as "title" or "fallback")
                    name: attachment.title || attachment.fallback || "Untitled File",

                    // The URL where the file can be downloaded / previewed
                    url: attachment.asset_url || attachment.image_url || attachment.thumb_url || "",

                    // "image", "file", "video", "audio", etc.
                    type: attachment.type || "file",

                    // MIME type e.g. "application/pdf" (may be missing for some files)
                    mimeType: attachment.mime_type || "",

                    // File size in bytes (may be undefined if Stream doesn't provide it)
                    fileSize: attachment.file_size,

                    // Who sent this message
                    sender: {
                        name: message.user?.name || message.user?.id || "Unknown",
                        image: message.user?.image || null,
                    },

                    // When the message was sent — convert to a JS Date so we can format it
                    sentAt: new Date(message.created_at),
                });
            });
        }

        return result;
    };

    // --- DATA FETCHING ---

    /*
     * fetchFiles(currentOffset, reset)
     * ---------------------------------
     * Fetches one "page" of messages that contain attachments.
     *
     * `currentOffset` — how many messages to skip (for pagination)
     * `reset`         — if true, we clear the existing list first
     *                   (used when the channel changes)
     */
    const fetchFiles = useCallback(
        async (currentOffset, reset = false) => {
            // Don't fetch if there's no channel yet
            if (!channel) return;

            setIsLoading(true);

            try {
                /*
                 * channel.query() is the main Stream API call.
                 *
                 * We filter for messages that have at least one attachment
                 * using "$exists: true". Stream then returns only matching messages.
                 *
                 * `limit`  → how many messages per page
                 * `offset` → how many to skip (for "load more" pagination)
                 */
                const result = await channel.query({
                    messages: {
                        limit: PAGE_SIZE,
                        offset: currentOffset,
                        filter_conditions: {
                            attachments: { $exists: true },
                        },
                    },
                });

                // Pull the messages array out of the result
                const messages = result.messages || [];

                // Convert those messages into our flat file list
                const newFiles = extractFiles(messages);

                if (reset) {
                    // Channel changed — start fresh
                    setFiles(newFiles);
                } else {
                    // "Load more" — append to the existing list
                    setFiles((prev) => [...prev, ...newFiles]);
                }

                // If we got fewer items than our page size, there's nothing more to load
                setHasMore(messages.length === PAGE_SIZE);

                // Advance the offset for the next potential "load more"
                setOffset(currentOffset + messages.length);
            } catch (err) {
                console.error("useChannelFiles: Failed to fetch files:", err);
            } finally {
                setIsLoading(false);
            }
        },
        [channel]
    );

    /*
     * Effect: re-fetch from scratch whenever the channel changes.
     * We reset offset to 0 and clear the existing file list.
     */
    useEffect(() => {
        if (!channel) return;

        // Reset pagination and fetch the first page
        setFiles([]);
        setOffset(0);
        setHasMore(true);
        fetchFiles(0, true);
    }, [channel?.id]); // Only re-run when the channel ID changes, not the whole object
    // eslint-disable-next-line react-hooks/exhaustive-deps

    /*
     * loadMore()
     * ----------
     * Called when the user clicks "Load More" in the UI.
     * It fetches the next page starting at the current offset.
     */
    const loadMore = () => {
        if (!isLoading && hasMore) {
            fetchFiles(offset);
        }
    };

    return { files, isLoading, hasMore, loadMore };
};
