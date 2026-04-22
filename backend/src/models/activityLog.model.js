import mongoose from "mongoose";

/**
 * 📋 ACTIVITY LOG SCHEMA
 *
 * This schema defines what a single "audit trail" entry looks like in MongoDB.
 * Every time a user performs an important action (like creating or deleting a task),
 * we create one of these records automatically.
 *
 * Think of it like a security camera log — it records: WHO did WHAT to WHICH resource, and WHEN.
 */
const activityLogSchema = new mongoose.Schema(
    {
        // ── WHO performed the action ──────────────────────────────────────────
        userId: {
            type: String,   // The Clerk user ID (e.g., "user_2abc123...")
            required: true,
        },
        userName: {
            type: String,   // Their display name (e.g., "Ojas Sharma") — for easy reading
            default: "Unknown User",
        },

        // ── WHAT action was performed ─────────────────────────────────────────
        action: {
            type: String,
            required: true,
            // Each action uses an ALL_CAPS verb pattern to make logs easy to scan
            enum: [
                "CREATE_TASK",
                "UPDATE_TASK",
                "DELETE_TASK",
                "UPDATE_TASK_STATUS",
                "UPDATE_USER_STATUS",
            ],
        },

        // ── WHICH resource was affected ───────────────────────────────────────
        resourceType: {
            type: String,   // What type of thing was affected (e.g., "Task", "User")
            required: true,
        },
        resourceId: {
            type: String,   // The MongoDB _id of the affected document, stored as a string
            default: null,
        },

        // ── EXTRA CONTEXT (optional) ──────────────────────────────────────────
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Flexible — can store any object
            default: {},
            // Example: { taskTitle: "Fix login bug", channelId: "team-alpha" }
        },

        // ── WHERE the request came from ───────────────────────────────────────
        ip: {
            type: String,   // The IP address of the client who made the request
            default: "unknown",
        },
    },
    {
        // Mongoose automatically adds `createdAt` and `updatedAt` fields
        timestamps: true,
    }
);

// Create and export the model so other files can use it
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
