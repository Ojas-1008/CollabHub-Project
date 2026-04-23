import { useState } from "react";
import { useStateStore, useMessageComposer, useMessageInputContext } from "stream-chat-react";
import { WandSparklesIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { refineMessage } from "../../lib/api";

/**
 * ✏️ CUSTOM MESSAGE INPUT — Stream's Input + AI Refine Button
 *
 * HOW THIS WORKS (Stream Chat React v13):
 *  In v13, message text is managed by a "MessageComposer" class.
 *  The old `setText` and `handleChange` from useMessageInputContext
 *  no longer exist. Instead:
 *
 *  1. useMessageComposer() → gives us the `messageComposer` object.
 *  2. messageComposer.textComposer → manages the text state.
 *  3. textComposer.handleChange({ text, selection }) → updates the text.
 *  4. useMessageInputContext().handleSubmit → sends the message.
 *
 *  We read the current text via useStateStore(textComposer.state).
 */

// This selector tells useStateStore which fields to watch
const textSelector = (state) => ({ text: state.text });

const CustomMessageInput = () => {
    // Step 1: Get the message composer (v13 API)
    const messageComposer = useMessageComposer();
    const { textComposer } = messageComposer;

    // Step 2: Subscribe to the text state so the component re-renders on changes
    const { text } = useStateStore(textComposer.state, textSelector);

    // Step 3: Get handleSubmit from the input context (this still lives here in v13)
    const { handleSubmit, textareaRef } = useMessageInputContext();

    // Step 4: Local state for tracking the AI refinement loading state
    const [isRefining, setIsRefining] = useState(false);

    // Step 5: Handle typing — call textComposer.handleChange with text + selection
    const onTextChange = (e) => {
        const newText = e.target.value;
        textComposer.handleChange({
            text: newText,
            selection: {
                start: e.target.selectionStart,
                end: e.target.selectionEnd,
            },
        });
    };

    // Step 6: The refine handler — sends text to AI and replaces input
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
            // In v13, we update text via textComposer.handleChange
            const refined = result.refinedText;
            textComposer.handleChange({
                text: refined,
                selection: { start: refined.length, end: refined.length },
            });

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
                    onChange={onTextChange}
                    rows={1}
                    onKeyDown={(e) => {
                        // Send on Enter (but not Shift+Enter for new lines)
                        if (e.key === "Enter" && !e.shiftKey && messageComposer.hasSendableData) {
                            e.preventDefault();
                            handleSubmit();
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
