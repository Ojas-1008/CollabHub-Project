import OpenAI from "openai";
import { ENV } from "./env.js";

/**
 * 🤖 AI CLIENT — Cerebras Cloud via OpenAI SDK
 *
 * HOW THIS WORKS:
 *  Cerebras provides an API that speaks the exact same language as OpenAI.
 *  So instead of installing a separate Cerebras SDK, we just use the standard
 *  OpenAI SDK and point it at Cerebras's servers using `baseURL`.
 *
 *  Think of it like mailing a letter — the format (OpenAI SDK) is the same,
 *  but the address (baseURL) is different. Cerebras receives the letter,
 *  processes it with their ultra-fast hardware, and sends back the reply.
 *
 * WHY CEREBRAS?
 *  - They run models on custom silicon (Wafer-Scale Engine) that is
 *    dramatically faster than standard GPUs.
 *  - GPT-OSS-120B on Cerebras can hit ~3,000 tokens/second.
 */

const cerebrasClient = new OpenAI({
    baseURL: "https://api.cerebras.ai/v1",   // Point to Cerebras instead of OpenAI
    apiKey: ENV.CEREBRAS_API_KEY,             // Your Cerebras API key
});

export default cerebrasClient;
