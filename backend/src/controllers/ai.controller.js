import cerebrasClient from "../config/ai.js";
import { logActivity } from "../utils/auditLog.js";

/**
 * 🤖 AI CONTROLLER — The Brain Behind Our AI Features
 *
 * This file contains two AI-powered actions:
 *
 *  1. summarizeMessages — Takes the last N chat messages and produces
 *     a clean, bullet-point summary using Llama 3.1-8B.
 *
 *  2. refineMessage — Takes a rough draft message and polishes it
 *     using Llama 3.1-8B (ultra-fast for quick edits).
 *
 * ARCHITECTURE:
 *  Frontend → POST /api/ai/summarize or /api/ai/refine
 *           → This controller formats the prompt
 *           → Sends it to Cerebras Cloud (via OpenAI SDK)
 *           → Returns the AI-generated text to the frontend
 */


// ─────────────────────────────────────────────────────────────────────────────
// 1. SUMMARIZE MESSAGES
//    Takes an array of messages and returns a concise summary.
// ─────────────────────────────────────────────────────────────────────────────
export const summarizeMessages = async (req, res) => {
    try {
        // Step 1: Get the messages array from the request body
        //         Each message should have { sender, text }
        const { messages } = req.body;

        // Step 2: Validate — we need at least 1 message to summarize
        if (!messages || messages.length === 0) {
            return res.status(400).json({ message: "No messages provided to summarize." });
        }

        // Step 3: Format the messages into a readable conversation string
        //         Example: "Alice: Hey, are we meeting today?\nBob: Yes, 3pm works."
        const conversationText = messages
            .map((msg) => `${msg.sender}: ${msg.text}`)
            .join("\n");

        // Step 4: Send the conversation to Cerebras (Llama 3.1-8B)
        //         We use a "system" prompt to tell the AI HOW to behave,
        //         and a "user" prompt to give it the actual conversation.
        const response = await cerebrasClient.chat.completions.create({
            model: "llama3.1-8b",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that summarizes chat conversations. " +
                        "Provide a summary in 3-5 concise bullet points. " +
                        "CRITICAL: You MUST format the output using standard Markdown lists (e.g. start each point with '- '). Do NOT use special bullet characters like '•'. " +
                        "Highlight key decisions, action items, and important topics discussed. " +
                        "Use a professional and encouraging tone. " +
                        "Do NOT include any introductory or closing phrases — just the markdown list.",
                },
                {
                    role: "user",
                    content: `Please summarize this conversation:\n\n${conversationText}`,
                },
            ],
            max_tokens: 500,    // Keep summaries focused
            temperature: 0.3,   // Lower = more factual, less creative
        });

        // Step 5: Extract the AI's reply from the response
        const summary = response.choices[0].message.content;

        // Step 6: Log the action for our audit trail
        await logActivity({
            userId: req.auth().userId,
            userName: "System",
            action: "AI_SUMMARIZE",
            resourceType: "Channel",
            metadata: { messageCount: messages.length },
            ip: req.ip,
        });

        // Step 7: Send the summary back to the frontend
        return res.status(200).json({ summary });

    } catch (error) {
        console.error("❌ [AI Controller] Summarization failed:", error.message);
        return res.status(500).json({ message: "AI summarization failed. Please try again." });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. REFINE MESSAGE
//    Takes a rough draft message and returns a polished version.
// ─────────────────────────────────────────────────────────────────────────────
export const refineMessage = async (req, res) => {
    try {
        // Step 1: Get the draft message from the request body
        const { text } = req.body;

        // Step 2: Validate — we need actual text to refine
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: "No message text provided to refine." });
        }

        // Step 3: Send the draft to Cerebras (Llama 3.1-8B)
        //         Llama 3.1-8B is chosen here because it's extremely fast
        //         and great for simple language polishing tasks.
        const response = await cerebrasClient.chat.completions.create({
            model: "llama3.1-8b",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a writing assistant for a team chat application. " +
                        "Refine the user's message to be more professional, clear, and concise " +
                        "while keeping the original intent and meaning. " +
                        "Keep the length similar to the original. " +
                        "Do NOT add greetings, sign-offs, or any extra commentary. " +
                        "Return ONLY the refined message text.",
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            max_tokens: 300,    // Keep it concise
            temperature: 0.5,   // Balanced between creative and factual
        });

        // Step 4: Extract the AI's refined text
        const refinedText = response.choices[0].message.content;

        // Step 5: Log the action for our audit trail
        await logActivity({
            userId: req.auth().userId,
            userName: "System",
            action: "AI_REFINE",
            resourceType: "Message",
            metadata: { originalLength: text.length, refinedLength: refinedText.length },
            ip: req.ip,
        });

        // Step 6: Send the refined text back to the frontend
        return res.status(200).json({ refinedText });

    } catch (error) {
        console.error("❌ [AI Controller] Refinement failed:", error.message);
        return res.status(500).json({ message: "AI refinement failed. Please try again." });
    }
};
