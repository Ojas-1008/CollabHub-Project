import { useState, useRef, useEffect } from "react";
import { useMessageInputContext } from "stream-chat-react";
import { WandSparklesIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { refineMessage } from "../../lib/api";

/**
 * ✏️ CUSTOM MESSAGE INPUT — Stream's Input + AI Refine Button
 *
 * HOW THIS WORKS:
 *  Stream Chat SDK gives us a <MessageInput> component that handles
 *  typing, sending, file uploads, emoji, and more. Instead of rebuilding
 *  all of that, we use Stream's "custom input" pattern:
 *
 *  1. We render Stream's default textarea and send button (via the
 *     useMessageInputContext hook).
 *  2. We ADD our own "Refine" button (magic wand icon) next to the
 *     send button.
 *  3. When clicked, we grab the current text, send it to our AI backend,
 *     and replace the input text with the polished version.
 *
 * WHY THIS APPROACH:
 *  - We get ALL of Stream's built-in features for free (attachments,
 *    emoji picker, mentions, etc.)
 *  - We only add ONE extra button — minimal code, maximum impact.
 */

const CustomMessageInput = () => {
    // Step 1: Get Stream's built-in input tools from context
    //         These are provided by the <Channel> component higher up in the tree.
    const {
        text,            // The current text in the input field
        setText,         // Function to update the input text
        handleSubmit,    // Function to send the message
        handleChange,    // Function to handle text changes (typing)
    } = useMessageInputContext();

    // Step 2: Local state for tracking the AI refinement loading state
    const [isRefining, setIsRefining] = useState(false);
    const textareaRef = useRef(null);

    // Step 2.5: Auto-resize textarea as user types
    const adjustHeight = () => {
        if (textareaRef.current) {
            const el = textareaRef.current;
            // Reset to inherit to correctly measure content height
            el.style.height = "inherit";
            const scrollHeight = el.scrollHeight;
            el.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [text]);

    // Step 3: The refine handler — sends text to AI and replaces input
    const handleRefine = async () => {
        // Guard: Don't refine empty messages
        if (!text || text.trim().length === 0) {
            toast.error("Type a message first, then refine it!");
            return;
        }

        // Guard: Prevent double-clicking while already refining
        if (isRefining) return;

        try {
            setIsRefining(true);

            // Call our backend AI endpoint
            const result = await refineMessage(text);

            // Replace the input text with the AI-polished version
            setText(result.refinedText);

            // Show a success toast so the user knows it worked
            toast.success("Message refined by AI ✨");
        } catch (error) {
            console.error("Refinement failed:", error);
            toast.error("AI refinement failed. Please try again.");
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <div className="custom-message-input-wrapper">
            {/* The text input area */}
            <div className="custom-message-input-container">
                <textarea
                    ref={textareaRef}
                    className="custom-message-textarea"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => {
                        handleChange(e);
                        requestAnimationFrame(() => adjustHeight());
                    }}
                    onKeyDown={(e) => {
                        // Send on Enter (but not Shift+Enter for new lines)
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />

                {/* Action buttons container */}
                <div className="custom-message-actions">
                    {/* AI Refine Button — Magic Wand */}
                    <button
                        type="button"
                        className={`refine-btn ${isRefining ? "refine-btn--loading" : ""}`}
                        onClick={handleRefine}
                        disabled={isRefining}
                        title="Refine message with AI"
                    >
                        {isRefining ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                        ) : (
                            <WandSparklesIcon className="w-4 h-4" />
                        )}
                    </button>

                    {/* Send Button */}
                    <button
                        type="button"
                        className="send-btn"
                        onClick={handleSubmit}
                        disabled={!text || text.trim().length === 0}
                        title="Send message"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                        >
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomMessageInput;
