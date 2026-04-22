import { User } from "../models/user.model.js";
import { upsertStreamUser } from "../config/stream.js";
import { logActivity } from "../utils/auditLog.js";

/**
 * Updates a user's custom status in both our database and Stream Chat.
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const clerkId = req.auth().userId;

        if (!clerkId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Validate status length (max 50 chars)
        if (status && status.length > 50) {
            return res.status(400).json({ message: "Status must be 50 characters or less" });
        }

        // 1. Update in our MongoDB
        // We use findOneAndUpdate to locate by clerkId and get the updated document back
        const updatedUser = await User.findOneAndUpdate(
            { clerkId },
            { status: status || "" }, // Default to empty string if null/undefined
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Sync to Stream Chat
        // We only need to send the ID and the field we are updating.
        // In Stream, the 'id' must be the user's clerkId since we established that in inngest.js
        await upsertStreamUser({
            id: clerkId,
            status: status || ""
        });

        // Record the status update in the audit trail
        await logActivity({
            userId: clerkId,
            userName: updatedUser.name,
            action: "UPDATE_USER_STATUS",
            resourceType: "User",
            resourceId: updatedUser._id.toString(),
            metadata: { newStatus: status || "" },
            ip: req.ip,
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateUserStatus:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
};
