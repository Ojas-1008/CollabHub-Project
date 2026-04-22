import { ActivityLog } from "../models/activityLog.model.js";

/**
 * 📂 GET RECENT ACTIVITY LOGS
 *
 * Fetches the most recent activity log entries from MongoDB.
 * Returns the last 50 actions, sorted from newest to oldest.
 *
 * ROUTE: GET /api/activity
 * PROTECTED: Yes (must be logged in)
 *
 * OPTIONAL QUERY PARAMS:
 *  - ?userId=user_123   → Filter logs for a specific user
 *  - ?action=CREATE_TASK → Filter logs by action type
 *  - ?limit=20          → Change how many logs to return (default: 50)
 */
export const getActivityLogs = async (req, res) => {
    try {
        // Step 1: Extract any filter options from the query string
        //         e.g., GET /api/activity?action=DELETE_TASK&limit=10
        const { userId, action, limit } = req.query;

        // Step 2: Build a "filter" object — only include filters that were provided
        const filter = {};
        if (userId) filter.userId = userId;     // Filter by a specific user
        if (action) filter.action = action;     // Filter by action type

        // Step 3: Parse the limit, falling back to 50 if not specified
        const maxResults = parseInt(limit) || 50;

        // Step 4: Query MongoDB for matching logs, sorted newest-first
        const logs = await ActivityLog.find(filter)
            .sort({ createdAt: -1 }) // -1 = descending (newest first)
            .limit(maxResults);

        // Step 5: Send the results back
        res.status(200).json({
            count: logs.length,
            logs,
        });
    } catch (error) {
        console.error("❌ Error fetching activity logs:", error);
        res.status(500).json({ message: "Server error fetching activity logs" });
    }
};
