import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, updateTaskStatus } from "../../lib/api";
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
            // Tell TanStack Query that the tasks list is now "old" so it fetches it again
            queryClient.invalidateQueries({ queryKey: ["tasks", channelId] });
            toast.success("Status updated!");
        },
        onError: (err) => {
            console.error("Task update error:", err);
            toast.error("Failed to update status.");
        }
    });

    return {
        tasks,
        isLoading,
        error,
        updateStatus,
        isUpdating
    };
};
