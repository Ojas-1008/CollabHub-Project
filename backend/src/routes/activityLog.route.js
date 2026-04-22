import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getActivityLogs } from "../controllers/activityLog.controller.js";

const router = express.Router();

/**
 * GET /api/activity
 * Returns recent audit log entries.
 * Protected — only authenticated users can view the activity trail.
 *
 * Optional query params:
 *   ?userId=user_123      → Logs for a specific user
 *   ?action=CREATE_TASK   → Logs for a specific action
 *   ?limit=20             → Limit the number of results (default: 50)
 */
router.get("/", protectRoute, getActivityLogs);

export default router;
