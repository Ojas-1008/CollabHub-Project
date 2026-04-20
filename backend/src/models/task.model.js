import mongoose from "mongoose";

/**
 * 📝 TASK MODEL
 * This model stores tasks created from chat messages.
 * It links to the User who created it, the User assigned to it, 
 * and the specific Stream Channel/Message it originated from.
 */
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    // The person assigned to do the task
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The person who clicked "Create Task"
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The Stream Channel ID where the task was created
    channelId: {
        type: String,
        required: true,
    },
    // The specific Stream Message ID that triggered this task
    messageId: {
        type: String,
        required: true,
    },
    dueDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    }
}, { 
    // This automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true 
});

export const Task = mongoose.model("Task", taskSchema);
