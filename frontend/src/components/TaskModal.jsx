import React, { useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { XIcon, CheckSquareIcon, UserIcon, CalendarIcon, AlignLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import { createTask } from "../../lib/api";

/**
 * 🎯 TASK MODAL
 * A premium-styled glassmorphic modal that converts a chat message into a task.
 * 
 * Props:
 * - message: The Stream message object we are converting.
 * - onClose: Function to close the modal.
 */
const TaskModal = ({ message, onClose }) => {
    const { client } = useChatContext();
    const { channel } = useChannelStateContext();

    // --- 1. STATE ---
    const [title, setTitle] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [description, setDescription] = useState(message.text || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 2. DATA PREP ---
    // Get all members of the current channel so the user can assign the task
    const members = Object.values(channel.state.members || {}).map(m => m.user);

    // --- 3. SUBMISSION ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!title.trim()) return toast.error("Please provide a task title");
        if (!assigneeId) return toast.error("Please assigned a team member");

        setIsSubmitting(true);

        try {
            // Data for our backend
            const taskData = {
                title: title.trim(),
                description: description.trim(),
                assigneeClerkId: assigneeId, // Backend expects Clerk ID
                channelId: channel.id,
                messageId: message.id,
                dueDate: dueDate || null
            };

            await createTask(taskData);
            
            toast.success("Task created successfully!");
            onClose(); // Close the modal on success
        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Failed to create task. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-purple-950/40 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <CheckSquareIcon className="size-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Create Task</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-purple-300"
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* TITLE INPUT */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-purple-300/80 uppercase tracking-wider ml-1">Task Title</label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-950/50 border border-purple-500/20 rounded-xl text-white placeholder-purple-400/50 focus:border-purple-400 outline-none transition-all text-sm shadow-inner"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* ASSIGNEE SELECT */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-purple-300/80 uppercase tracking-wider ml-1">Assign To</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-400/60" />
                            <select 
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-purple-950/50 border border-purple-500/20 rounded-xl text-white outline-none focus:border-purple-400 appearance-none text-sm transition-all shadow-inner"
                            >
                                <option value="" className="bg-purple-950 text-purple-300">Select team member...</option>
                                {members.map(user => (
                                    <option key={user.id} value={user.id} className="bg-purple-950 text-white">
                                        {user.name || user.id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* DUE DATE INPUT */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-purple-300/80 uppercase tracking-wider ml-1">Due Date (Optional)</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-400/60" />
                            <input 
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-purple-950/50 border border-purple-500/20 rounded-xl text-white outline-none focus:border-purple-400 text-sm transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION (PRE-FILLED) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-purple-300/80 uppercase tracking-wider ml-1">Context / Description</label>
                        <div className="relative">
                            <AlignLeftIcon className="absolute left-3.5 top-3.5 size-4 text-purple-400/60" />
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-3 bg-purple-950/50 border border-purple-500/20 rounded-xl text-white placeholder-purple-400/50 focus:border-purple-400 outline-none transition-all text-sm resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !assigneeId}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <CheckSquareIcon className="size-4 group-hover:scale-110 transition-transform" />
                                    <span>Confirm Task</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default TaskModal;
