import express from "express";
import { getStreamToken } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

// Apply the strict auth rate limiter to the token endpoint.
// This prevents anyone from hammering this route to farm Stream tokens.
router.get("/token", authLimiter, protectRoute, getStreamToken);

export default router;