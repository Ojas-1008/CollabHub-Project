import { ActivityLog } from "../models/activityLog.model.js";

/**
 * 📝 LOG ACTIVITY — The "Security Camera" Helper
 *
 * This is a simple, reusable function that you call any time a user does
 * something important. It creates a new record in the ActivityLog collection.
 *
 * HOW TO USE IT (example from a controller):
 *   await logActivity({
 *       userId: req.auth().userId,
 *       userName: "Ojas Sharma",
 *       action: "CREATE_TASK",
 *       resourceType: "Task",
 *       resourceId: newTask._id.toString(),
 *       metadata: { taskTitle: newTask.title, channelId: newTask.channelId },
 *       ip: req.ip,
 *   });
 *
 * @param {object} data - The details of the action to log.
 */
export const logActivity = async (data) => {
    try {
        // Create a new document in the ActivityLog collection
        await ActivityLog.create(data);
        console.log(`📋 [Audit Log] ${data.action} by ${data.userName}`);
    } catch (error) {
        // IMPORTANT: We only log the error but do NOT throw it.
        // The audit log failing should NEVER crash the main request.
        console.error("❌ [Audit Log Error] Failed to write log entry:", error.message);
    }
};
