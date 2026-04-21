import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, updateTaskStatus, updateTask, deleteTask } from "../../lib/api";
import toast from "react-hot-toast";

/**
 * 🛠️ USER TASKS HOOK
 * This hook manages fetching and updating tasks for the active channel.
 * It uses TanStack Query for efficient caching and "optimistic" behavior.
 */
export const useTasks = (channelId) => {
    const queryClient = useQueryClient();

    // 1. FETCH TASKS
    // This will run automatically whenever channelId changes.
    const { data: tasks = [], isLoading, error } = useQuery({
        queryKey: ["tasks", channelId],
        queryFn: () => getTasks(channelId),
        enabled: !!channelId, // Only fetch if we have a valid channel ID
    });

    // 2. UPDATE TASK STATUS
    // Used to move tasks between 'todo' and 'done' status.
    const { mutate: updateStatus, isLoading: isUpdating } = useMutation({
        mutationFn: ({ taskId, status }) => updateTaskStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", channelId] });
            toast.success("Status updated!");
        },
        onError: (err) => {
            console.error("Task update error:", err);
            toast.error("Failed to update status.");
        }
    });

    // 3. UPDATE TASK DETAILS (EDIT)
    const { mutate: editTask, isLoading: isEditing } = useMutation({
        mutationFn: ({ taskId, taskData }) => updateTask(taskId, taskData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", channelId] });
            toast.success("Task updated!");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to update task.";
            toast.error(msg);
        }
    });

    // 4. DELETE TASK
    const { mutate: removeTask, isLoading: isDeleting } = useMutation({
        mutationFn: (taskId) => deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", channelId] });
            toast.success("Task deleted!");
        },
        onError: (err) => {
            toast.error("Failed to delete task.");
        }
    });

    return {
        tasks,
        isLoading,
        error,
        updateStatus,
        isUpdating,
        editTask,
        isEditing,
        removeTask,
        isDeleting
    };
};

