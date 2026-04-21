import React, { useState } from "react";
import { XIcon, CheckCircle2Icon, CircleIcon, CalendarIcon, UserIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useChannelStateContext } from "stream-chat-react";
import TaskModal from "./TaskModal";

/**
 * 📊 TASK LIST DRAWER
 * A slide-out panel that displays all tasks for the current channel.
 */
const TaskListDrawer = ({ onClose }) => {
    const { channel } = useChannelStateContext();
    const { tasks, isLoading, updateStatus, removeTask } = useTasks(channel.id);
    
    // State to track if we're currently editing a task
    const [editingTask, setEditingTask] = useState(null);

    // Filter tasks into simple categories
    const todoTasks = tasks.filter(t => t.status !== "done");
    const completedTasks = tasks.filter(t => t.status === "done");

    const handleToggleStatus = (task) => {
        const newStatus = task.status === "done" ? "todo" : "done";
        updateStatus({ taskId: task._id, status: newStatus });
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            removeTask(taskId);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] z-[100] bg-white/85 backdrop-blur-[24px] border-l border-white/60 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* HEADER */}
            <div className="p-6 border-b border-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center border border-purple-200/50 shadow-sm">
                        <CheckCircle2Icon className="size-4.5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Channel Tasks</h2>
                        <p className="text-[10px] text-purple-600/70 font-bold uppercase tracking-widest">{tasks.length} {tasks.length === 1 ? 'item' : 'items'} total</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="size-8 rounded-xl bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all"
                >
                    <XIcon className="size-4" />
                </button>
            </div>

            {/* TASK LIST CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 ch-scrollbar">
                
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <Loader2Icon className="size-8 text-purple-600 animate-spin" />
                        <p className="text-sm text-gray-500 font-medium">Fetching tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="size-16 rounded-3xl bg-purple-50 border border-dashed border-purple-200 flex items-center justify-center">
                            <CheckCircle2Icon className="size-8 text-purple-300" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800">No tasks yet</p>
                            <p className="text-sm font-medium text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed">
                                Convert messages into tasks to keep your team on track.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* SECTION: TO-DO */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-purple-600 uppercase tracking-widest pl-2">To Do</h3>
                            <div className="space-y-3">
                                {todoTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onToggle={() => handleToggleStatus(task)} 
                                        onEdit={() => setEditingTask(task)}
                                        onDelete={() => handleDeleteTask(task._id)}
                                    />
                                ))}
                                {todoTasks.length === 0 && <p className="text-[13px] font-medium text-gray-400 pl-2">Everything is caught up! 🎉</p>}
                            </div>
                        </div>

                        {/* SECTION: COMPLETED */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-purple-600 uppercase tracking-widest pl-2">Completed</h3>
                            <div className="space-y-3 opacity-70">
                                {completedTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onToggle={() => handleToggleStatus(task)} 
                                        onDelete={() => handleDeleteTask(task._id)}
                                        isDone 
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* EDIT MODAL OVERLAY */}
            {editingTask && (
                <TaskModal 
                    task={editingTask} 
                    onClose={() => setEditingTask(null)} 
                />
            )}
            
            {/* Footer removed per user request */}
        </div>
    );
};

/**
 * 🃏 TASK CARD COMPONENT
 * Individual task display item
 */
const TaskCard = ({ task, onToggle, onEdit, onDelete, isDone = false }) => {
    return (
        <div className={`group p-4 bg-white/40 border border-white/60 rounded-2xl transition-all hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-200/50 relative overflow-hidden ${isDone ? 'bg-gray-50/50 shadow-none hover:shadow-none hover:bg-gray-50/80 border-gray-100' : ''}`}>
            
            {/* Status Checkbox */}
            <button 
                onClick={onToggle}
                className="absolute left-0 inset-y-0 w-12 flex items-center justify-center group-hover:bg-purple-50 transition-colors"
                title={isDone ? "Mark as incomplete" : "Mark as done"}
            >
                {isDone ? (
                    <CheckCircle2Icon className="size-5 text-emerald-500" />
                ) : (
                    <CircleIcon className="size-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                )}
            </button>

            <div className="ml-8 pr-12 space-y-2">
                <h4 className={`font-bold text-[14.5px] text-gray-900 tracking-tight leading-snug ${isDone ? 'line-through text-gray-400' : 'group-hover:text-purple-700 transition-colors'}`}>
                    {task.title}
                </h4>
                
                {task.description && !isDone && (
                    <p className="text-[13.5px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                        {task.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Assignee */}
                    <div className="flex items-center gap-1.5 bg-purple-50 py-1 px-2.5 rounded-lg border border-purple-100">
                        <UserIcon className="size-3 text-purple-600" />
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                            {task.assignee?.name || 'Unassigned'}
                        </span>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-2.5 rounded-lg border border-gray-100">
                            <CalendarIcon className="size-3 text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons (Right Side) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isDone && onEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"
                        title="Edit Task"
                    >
                        <PencilIcon className="size-3.5" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Task"
                >
                    <Trash2Icon className="size-3.5" />
                </button>
            </div>

            {/* Subtle left border accent on hover */}
            {!isDone && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
        </div>
    );
};

export default TaskListDrawer;
