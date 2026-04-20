import React from "react";
import { XIcon, CheckCircle2Icon, CircleIcon, CalendarIcon, UserIcon, Loader2Icon } from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useChannelStateContext } from "stream-chat-react";

/**
 * 📊 TASK LIST DRAWER
 * A slide-out panel that displays all tasks for the current channel.
 */
const TaskListDrawer = ({ onClose }) => {
    const { channel } = useChannelStateContext();
    const { tasks, isLoading, updateStatus } = useTasks(channel.id);

    // Filter tasks into simple categories
    const todoTasks = tasks.filter(t => t.status !== "done");
    const completedTasks = tasks.filter(t => t.status === "done");

    const handleToggleStatus = (task) => {
        const newStatus = task.status === "done" ? "todo" : "done";
        updateStatus({ taskId: task._id, status: newStatus });
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] z-[100] bg-purple-950/40 backdrop-blur-2xl border-l border-purple-500/20 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* HEADER */}
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-l from-purple-900/40 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <CheckCircle2Icon className="size-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Channel Tasks</h2>
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{tasks.length} items total</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-purple-300"
                >
                    <XIcon className="size-5" />
                </button>
            </div>

            {/* TASK LIST CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                        <Loader2Icon className="size-8 text-purple-400 animate-spin" />
                        <p className="text-sm text-purple-300 font-medium">Fetching tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <CheckCircle2Icon className="size-12 text-purple-400" />
                        <div>
                            <p className="text-lg font-bold text-white">No tasks yet</p>
                            <p className="text-xs text-purple-200">Convert messages into tasks to keep your team on track.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* SECTION: TO-DO */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-purple-300/60 uppercase tracking-widest ml-1">To Do</h3>
                            <div className="space-y-3">
                                {todoTasks.map(task => (
                                    <TaskCard key={task._id} task={task} onToggle={() => handleToggleStatus(task)} />
                                ))}
                                {todoTasks.length === 0 && <p className="text-xs text-purple-400/50 italic ml-1">Everything is caught up!</p>}
                            </div>
                        </div>

                        {/* SECTION: COMPLETED */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-purple-300/60 uppercase tracking-widest ml-1">Completed</h3>
                            <div className="space-y-3 opacity-60">
                                {completedTasks.map(task => (
                                    <TaskCard key={task._id} task={task} onToggle={() => handleToggleStatus(task)} isDone />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-purple-950/20 border-t border-purple-500/10">
                <p className="text-[9px] text-center text-purple-400/60 uppercase font-bold tracking-tighter">
                    CollabHub Task System • Version 1.0
                </p>
            </div>
        </div>
    );
};

/**
 * 🃏 TASK CARD COMPONENT
 * Individual task display item
 */
const TaskCard = ({ task, onToggle, isDone = false }) => {
    return (
        <div className={`group p-4 bg-purple-900/20 border border-purple-500/10 rounded-2xl transition-all hover:bg-purple-900/30 hover:border-purple-500/30 shadow-sm overflow-hidden relative ${isDone ? 'bg-black/10' : ''}`}>
            
            {/* Status Checkbox */}
            <button 
                onClick={onToggle}
                className="absolute left-0 inset-y-0 w-12 flex items-center justify-center group-hover:bg-purple-500/5 transition-colors"
            >
                {isDone ? (
                    <CheckCircle2Icon className="size-5 text-green-400" />
                ) : (
                    <CircleIcon className="size-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
                )}
            </button>

            <div className="ml-8 space-y-2">
                <h4 className={`font-bold text-sm text-white tracking-tight ${isDone ? 'line-through text-white/40' : ''}`}>
                    {task.title}
                </h4>
                
                {task.description && !isDone && (
                    <p className="text-xs text-purple-300/70 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center gap-4 pt-1">
                    {/* Assignee Avatar */}
                    <div className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-full border border-white/5">
                        <UserIcon className="size-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-200">
                            {task.assignee?.name || 'Unassigned'}
                        </span>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-3 text-purple-400/60" />
                            <span className="text-[10px] font-medium text-purple-300/60">
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Gradient Glow */}
            {!isDone && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl -z-10 group-hover:bg-purple-500/10 transition-all rounded-full" />
            )}
        </div>
    );
};

export default TaskListDrawer;
