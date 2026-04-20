import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";

/**
 * 🚀 CREATE A NEW TASK
 * Converts a chat message into a trackable task.
 */
export const createTask = async (req, res) => {
    try {
        const { title, description, assigneeClerkId, channelId, messageId, dueDate } = req.body;
        const creatorClerkId = req.auth().userId;

        // Step 1: Find the users in our MongoDB (using their Clerk IDs)
        const creator = await User.findOne({ clerkId: creatorClerkId });
        const assignee = await User.findOne({ clerkId: assigneeClerkId });

        // Guard: If we can't find the users, we can't make the task
        if (!creator || !assignee) {
            return res.status(404).json({ message: "User not found in database" });
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

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error updating task" });
    }
};
