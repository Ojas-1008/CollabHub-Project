import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    createTask, 
    getTasksByChannel, 
    updateTaskStatus 
} from "../controllers/task.controller.js";

const router = express.Router();

/**
 * 🔒 ALL TASK ROUTES ARE PROTECTED
 * Users must be logged in to create or view tasks.
 */

// POST /api/tasks - Create a new task from a message
router.post("/", protectRoute, createTask);

// GET /api/tasks/channel/:channelId - Get all tasks for a specific channel
router.get("/channel/:channelId", protectRoute, getTasksByChannel);

// PATCH /api/tasks/:taskId - Update the status of a task
router.patch("/:taskId", protectRoute, updateTaskStatus);

export default router;
