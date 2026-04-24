import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
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


/**
 * 👤 GET MY PROFILE
 * Fetches the logged-in user's full profile from MongoDB,
 * along with some useful stats like task counts and recent activity.
 *
 * ROUTE: GET /api/users/me
 */
export const getUserProfile = async (req, res) => {
    try {
        // Step 1: Get the logged-in user's Clerk ID from the auth middleware
        const clerkId = req.auth().userId;

        // Step 2: Find the user document in MongoDB using their clerkId
        const user = await User.findOne({ clerkId });

        // Guard: If not found, something went wrong with syncing
        if (!user) {
            return res.status(404).json({ message: "User not found in database." });
        }

        // Step 3: Fetch task stats — how many tasks are assigned to this user?
        //         We use countDocuments() instead of find() because we only need numbers, not full data.
        const totalTasks     = await Task.countDocuments({ assignee: user._id });
        const completedTasks = await Task.countDocuments({ assignee: user._id, status: "done" });
        const pendingTasks   = await Task.countDocuments({ assignee: user._id, status: { $ne: "done" } });

        // Step 4: Fetch the user's 15 most recent activity log entries
        //         This powers the "Recent Activity" feed on the profile page.
        const recentActivity = await ActivityLog.find({ userId: clerkId })
            .sort({ createdAt: -1 })   // Newest first
            .limit(15);

        // Step 5: Send everything back as a single response object
        res.status(200).json({
            user,
            stats: {
                totalTasks,
                completedTasks,
                pendingTasks,
            },
            recentActivity,
        });

    } catch (error) {
        console.error("❌ Error in getUserProfile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};


/**
 * ✏️ UPDATE MY PROFILE
 * Saves changes to the user's extended profile fields (bio, jobTitle, etc.).
 *
 * ROUTE: PATCH /api/users/update
 */
export const updateUserProfile = async (req, res) => {
    try {
        // Step 1: Get the logged-in user's Clerk ID
        const clerkId = req.auth().userId;

        // Step 2: Extract only the fields we allow updating from the request body.
        //         This prevents someone from changing fields like "email" or "clerkId".
        const { bio, jobTitle, department, socialLinks, skills } = req.body;

        // Step 3: Build an update object — only include fields that were actually sent.
        //         This way, sending just { bio: "Hello" } won't erase the user's jobTitle.
        const updateFields = {};

        if (bio !== undefined)          updateFields.bio = bio;
        if (jobTitle !== undefined)     updateFields.jobTitle = jobTitle;
        if (department !== undefined)   updateFields.department = department;
        if (socialLinks !== undefined)  updateFields.socialLinks = socialLinks;
        if (skills !== undefined)       updateFields.skills = skills;

        // Step 4: Validate bio length
        if (bio && bio.length > 160) {
            return res.status(400).json({ message: "Bio must be 160 characters or less." });
        }

        // Step 5: Validate skills array — max 10 skills, each max 30 chars
        if (skills) {
            if (skills.length > 10) {
                return res.status(400).json({ message: "You can add up to 10 skills." });
            }
            const tooLong = skills.find(s => s.length > 30);
            if (tooLong) {
                return res.status(400).json({ message: "Each skill must be 30 characters or less." });
            }
        }

        // Step 6: Update the user document in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { clerkId },
            updateFields,
            { new: true }    // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Step 7: Record this action in the audit trail
        await logActivity({
            userId: clerkId,
            userName: updatedUser.name,
            action: "UPDATE_PROFILE",
            resourceType: "User",
            resourceId: updatedUser._id.toString(),
            metadata: { updatedFields: Object.keys(updateFields) },
            ip: req.ip,
        });

        // Step 8: Send the updated user back to the frontend
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("❌ Error in updateUserProfile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
