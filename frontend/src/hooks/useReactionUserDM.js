import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";

/**
 * useReactionUserDM
 *
 * This hook "listens" globally for clicks on the Stream reaction-details modal
 * user rows — something we can't do via JSX because the modal is rendered
 * internally by the SDK.
 *
 * Strategy: Event Delegation
 * We attach a single click handler to `document`. When it fires, we walk UP
 * the clicked element's ancestor chain (closest) to see if the click happened
 * inside a `.str-chat__message-reactions-details-reacting-user` row. If it
 * did, we read the user's name from the DOM, look them up in Stream, and
 * create / open the DM channel.
 */
const useReactionUserDM = () => {
    const { client } = useChatContext();
    const [, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!client || !client.user) return;

        const handleClick = async (e) => {
            // STEP 1: Check if the click was inside a reacting-user row
            const userRow = e.target.closest(
                ".str-chat__message-reactions-details-reacting-user"
            );
            if (!userRow) return; // Not our target — ignore

            // STEP 2: Find the avatar image inside that row to get the user's
            // Stream user ID from the `title` attribute on the avatar wrapper.
            // Stream renders: <div data-testid="avatar" title="User Name">
            const avatarEl = userRow.querySelector("[data-testid='avatar']");
            const reactionUserName = avatarEl?.title;

            if (!reactionUserName || !reactionUserName.trim()) return;

            try {
                // STEP 3: Query Stream for a user matching this name.
                // We can't easily get the user ID from the DOM, so we search by name.
                const { users } = await client.queryUsers(
                    { name: reactionUserName },
                    { id: 1 },
                    { limit: 5 }
                );

                // STEP 4: Find the exact user (exclude ourselves)
                const targetUser = users.find(
                    (u) => u.id !== client.user.id && u.name === reactionUserName
                );

                if (!targetUser) {
                    console.warn("[ReactionDM] Could not resolve user:", reactionUserName);
                    return;
                }

                // STEP 5: Build a deterministic, sorted channel ID (same logic as UsersList)
                const userIds = [client.user.id, targetUser.id].sort();
                const channelId = userIds.join("-").slice(0, 64);

                // STEP 6: Create/open the DM channel
                const channel = client.channel("messaging", channelId, {
                    members: [client.user.id, targetUser.id],
                });
                await channel.watch();

                // STEP 7: Navigate to the DM (closes the modal via URL update)
                setSearchParams({ channel: channel.id });
            } catch (error) {
                console.error("[ReactionDM] Failed to open DM:", error);
                Sentry.captureException(error);
            }
        };

        document.addEventListener("click", handleClick);

        // Cleanup: remove the listener when this component unmounts or client changes
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [client, setSearchParams]);
};

export default useReactionUserDM;
