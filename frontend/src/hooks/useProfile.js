import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateProfile } from "../../lib/api";
import toast from "react-hot-toast";

/**
 * 👤 USE PROFILE HOOK
 *
 * This custom hook handles everything related to the user's profile:
 *   1. FETCH — Loads the profile, task stats, and activity log from the backend.
 *   2. UPDATE — Saves changes to the profile and refreshes the cached data.
 *
 * It uses TanStack Query (React Query) to handle caching, loading states,
 * and automatic refetching — the same pattern used in useTasks.js.
 */
export const useProfile = () => {
    const queryClient = useQueryClient();

    // ── 1. FETCH PROFILE ─────────────────────────────────────────────────
    // This query runs once when the hook is first used.
    // The data is cached under the key ["userProfile"], so navigating away
    // and coming back won't trigger a new API call immediately.
    const {
        data: profileData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["userProfile"],
        queryFn: getUserProfile,
    });

    // ── 2. UPDATE PROFILE ────────────────────────────────────────────────
    // This mutation sends changed fields to the backend.
    // On success, it "invalidates" the cached profile, forcing a refetch
    // so the UI shows the latest data.
    const { mutate: saveProfile, isPending: isSaving } = useMutation({
        mutationFn: (updatedFields) => updateProfile(updatedFields),
        onSuccess: () => {
            // Tell TanStack Query: "the profile data is stale, refetch it"
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            toast.success("Profile updated!");
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to update profile.";
            toast.error(message);
        },
    });

    // ── 3. RETURN VALUES ─────────────────────────────────────────────────
    // We split profileData into its three parts for convenience:
    //   - user:           The User document from MongoDB
    //   - stats:          { totalTasks, completedTasks, pendingTasks }
    //   - recentActivity: Array of ActivityLog entries
    return {
        user: profileData?.user || null,
        stats: profileData?.stats || { totalTasks: 0, completedTasks: 0, pendingTasks: 0 },
        recentActivity: profileData?.recentActivity || [],
        isLoading,
        error,
        saveProfile,
        isSaving,
    };
};
