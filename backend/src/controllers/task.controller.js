import { clerkClient } from "@clerk/express";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { logActivity } from "../utils/auditLog.js";

/**
 * 🛠️ HELPER: ENSURE USER EXISTS
 * Checks if a user is in our MongoDB. If not, fetches from Clerk and creates them.
 */
const ensureUserExists = async (clerkId) => {
    // 1. Try to find in our DB first
    let user = await User.findOne({ clerkId });
    if (user) return user;

    // 2. If missing, fetch from Clerk
    try {
        console.log(`🔍 [Lazy Sync] User ${clerkId} not in DB. Fetching from Clerk...`);
        const clerkUser = await clerkClient.users.getUser(clerkId);
        
        if (!clerkUser) return null;

        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
        const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

        // 3. Create in MongoDB on the fly
        user = await User.create({
            clerkId: clerkUser.id,
            email: primaryEmail,
            name: fullName || "User",
            image: clerkUser.imageUrl,
            status: "" // Default status
        });

        console.log(`✅ [Lazy Sync] Created missing user ${clerkId} in MongoDB.`);
        return user;
    } catch (error) {
        console.error(`❌ [Lazy Sync Error] Failed to sync user ${clerkId}:`, error);
        return null;
    }
};

/**
 * 🚀 CREATE A NEW TASK
 * Converts a chat message into a trackable task.
 */
export const createTask = async (req, res) => {
    try {
        const { title, description, assigneeClerkId, channelId, messageId, dueDate } = req.body;
        const creatorClerkId = req.auth().userId;

        // Step 1: Ensure both users exist in our DB (Sync from Clerk if needed)
        const creator = await ensureUserExists(creatorClerkId);
        const assignee = await ensureUserExists(assigneeClerkId);

        // Guard: If we can't find or sync the users, we can't make the task
        if (!creator) {
            return res.status(400).json({ message: "Creator (you) not found. Please refresh." });
        }
        if (!assignee) {
            return res.status(400).json({ message: "Assignee not found. They may need to log in first." });
        }

        // Step 2: Create a new Task instance
        const newTask = new Task({
            title,
            description,
            creator: creator._id, // Store MongoDB _id
            assignee: assignee._id, // Store MongoDB _id
            channelId,
            messageId,
            dueDate
        });

        // Step 3: Save to MongoDB
        await newTask.save();

        // Step 4: Record this action in the audit trail
        await logActivity({
            userId: creatorClerkId,
            userName: creator.name,
            action: "CREATE_TASK",
            resourceType: "Task",
            resourceId: newTask._id.toString(),
            metadata: { taskTitle: newTask.title, channelId: newTask.channelId },
            ip: req.ip,
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server error creating task" });
    }
};

/**
 * 📂 GET ALL TASKS FOR A CHANNEL
 * Fetches every task linked to a specific Stream channel.
 */
export const getTasksByChannel = async (req, res) => {
    try {
        const { channelId } = req.params;

        // Find tasks for this channel and "populate" user details (name, image)
        const tasks = await Task.find({ channelId })
            .populate("assignee", "name image")
            .populate("creator", "name image")
            .sort({ createdAt: -1 }); // Newest tasks first

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server error fetching tasks" });
    }
};

/**
 * ✅ UPDATE TASK STATUS
 * Marks a task as 'todo', 'in-progress', or 'done'.
 */
export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { status },
            { new: true } // Return the updated version, not the old one
        ).populate("assignee", "name image");

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Record the status change in the audit trail
        await logActivity({
            userId: req.auth().userId,
            userName: "User", // We don't have name here, that's fine
            action: "UPDATE_TASK_STATUS",
            resourceType: "Task",
            resourceId: taskId,
            metadata: { newStatus: status },
            ip: req.ip,
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error updating task" });
    }
};

/**
 * 🗑️ DELETE TASK
 * Permanently removes a task from MongoDB.
 */
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Record the deletion in the audit trail
        await logActivity({
            userId: req.auth().userId,
            userName: "User",
            action: "DELETE_TASK",
            resourceType: "Task",
            resourceId: taskId,
            metadata: { taskTitle: deletedTask.title },
            ip: req.ip,
        });

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error deleting task" });
    }
};

/**
 * 📝 UPDATE TASK DETAILS
 * General purpose update for title, description, assignee, etc.
 */
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, assigneeClerkId, dueDate } = req.body;

        // 1. If assignee changed, ensure they exist in our DB
        let assigneeId = undefined;
        if (assigneeClerkId) {
            const assignee = await ensureUserExists(assigneeClerkId);
            if (!assignee) {
                return res.status(400).json({ message: "Assignee not found in system." });
            }
            assigneeId = assignee._id;
        }

        // 2. Perform the update
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { 
                title, 
                description, 
                ...(assigneeId && { assignee: assigneeId }), // Only update if provided
                dueDate 
            },
            { new: true } 
        ).populate("assignee", "name image");

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Record the update in the audit trail
        await logActivity({
            userId: req.auth().userId,
            userName: "User",
            action: "UPDATE_TASK",
            resourceType: "Task",
            resourceId: taskId,
            metadata: { taskTitle: updatedTask.title },
            ip: req.ip,
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task details:", error);
        res.status(500).json({ message: "Server error updating task" });
    }
};

