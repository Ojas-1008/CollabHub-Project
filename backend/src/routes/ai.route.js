import express from "express";
import { summarizeMessages, refineMessage } from "../controllers/ai.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter } from "../middleware/rateLimiter.middleware.js";

/**
 * 🤖 AI ROUTES
 *
 * These routes connect the frontend to our AI controller.
 * Both routes are protected (user must be logged in) and rate-limited
 * to prevent abuse and control API costs.
 *
 * POST /api/ai/summarize — Summarize the last N messages in a channel
 * POST /api/ai/refine    — Polish a draft message before sending
 */

const router = express.Router();

// Both routes use:
//  - apiLimiter:   Max 100 requests per 15 minutes (cost control)
//  - protectRoute: User must be authenticated via Clerk
router.post("/summarize", apiLimiter, protectRoute, summarizeMessages);
router.post("/refine", apiLimiter, protectRoute, refineMessage);

export default router;
