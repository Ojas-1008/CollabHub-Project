import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { addUserToPublicChannels, deleteStreamUser, upsertStreamUser, streamClient } from "./stream.js";
import { sendOfflineNotificationEmail } from "../utils/email.js";

// 1. Initialize the Inngest client (Used for handling background tasks/webhooks)
export const inngest = new Inngest({ id: "collabhub" });

/**
 * LOGIC: SYNC USER
 * This runs automatically whenever a NEW user signs up via Clerk.
 */
const syncUser = inngest.createFunction(
    {
        id: "sync-user",
        triggers: { event: "clerk/user.created" }
    },
    async ({ event }) => {
        try {
            // STEP 1: Connect to the Database
            await connectDB();
            
            // STEP 2: Extract and clean up the data from Clerk's event
            const { id, email_addresses, first_name, last_name, image_url } = event.data;
            const primaryEmail = email_addresses[0]?.email_address;
            const fullName = `${first_name || ""} ${last_name || ""}`.trim();

            const userData = {
                clerkId: id,
                email: primaryEmail,
                name: fullName || "New User",
                image: image_url,
            };

            // STEP 3: Save to MongoDB
            await User.create(userData);
            console.log(`✅ [Inngest] User ${id} saved to MongoDB.`);

            // STEP 4: Create the user's profile on Stream Chat
            await upsertStreamUser({
                id: userData.clerkId,
                name: userData.name,
                image: userData.image,
            });
            console.log(`✅ [Inngest] User ${id} profile synced to Stream Chat.`);

            // STEP 5: Add user to public discovery channels automatically
            await addUserToPublicChannels(userData.clerkId);
            console.log(`✅ [Inngest] User ${id} added to public channels.`);

        } catch (error) {
            console.error("❌ [Inngest Error] Failed to sync new user:", error);
            throw error; // Throwing the error tells Inngest to "retry" later
        }
    }
);

/**
 * LOGIC: DELETE USER
 * This runs automatically whenever a user is DELETED in Clerk.
 */
const deleteUserFromDB = inngest.createFunction(
    {
        id: "delete-user-from-db",
        triggers: { event: "clerk/user.deleted" }
    },
    async ({ event }) => {
        try {
            await connectDB();
            const { id } = event.data;

            // STEP 1: Delete from MongoDB
            await User.deleteOne({ clerkId: id });
            console.log(`🗑️ [Inngest] User ${id} deleted from MongoDB.`);

            // STEP 2: Delete from Stream Chat
            await deleteStreamUser(id);
            console.log(`🗑️ [Inngest] User ${id} profile removed from Stream.`);

        } catch (error) {
            console.error("❌ [Inngest Error] Failed to delete user:", error);
            throw error;
        }
    }
);

// Export the functions so they can be "served" by our Express server

/**
 * LOGIC: OFFLINE NOTIFICATIONS
 * Runs when Stream sends a message.new webhook event.
 */
const handleOfflineNotification = inngest.createFunction(
    {
        id: "offline-email-notification",
        triggers: { event: "stream/message.new" }
    },
    async ({ event, step }) => {
        const payload = event.data;
        const message = payload.message;
        const sender = payload.user;
        const channel = payload.channel;
        
        let initialRecipients = [];
        
        if (payload.channel_type === "messaging") {
            // Direct Message
            const members = channel.members || [];
            initialRecipients = members
                .map(m => m.user.id)
                .filter(id => id !== sender.id);
        } else {
            // Channel with @ mentions
            initialRecipients = (message.mentioned_users || [])
                .map(u => u.id)
                .filter(id => id !== sender.id);
        }

        if (initialRecipients.length === 0) {
            return { skipped: true, reason: "No eligible recipients." };
        }

        // Wait 2 minutes to debounce (allow users to read it if they are online)
        await step.sleep("wait-for-read", "2m");

        // Query the actual online status of the users after the wait
        const offlineUsers = await step.run("check-online-status", async () => {
            const { users } = await streamClient.queryUsers({ id: { $in: initialRecipients } });
            // stream user objects have an 'online' boolean
            return users.filter(u => !u.online).map(u => u.id);
        });

        if (offlineUsers.length === 0) {
            return { skipped: true, reason: "All recipients were online." };
        }

        // Send email to offline users
        await step.run("send-emails", async () => {
            await connectDB();
            
            // Find users in DB to get their emails
            const dbUsers = await User.find({ clerkId: { $in: offlineUsers } });
            
            const channelName = channel.name || (payload.channel_type === "messaging" ? "" : "a channel");
            
            const emailPromises = dbUsers.map(user => {
                return sendOfflineNotificationEmail({
                    email: user.email,
                    name: user.name,
                    senderName: sender.name || sender.id,
                    messageText: message.text,
                    channelName: channelName
                });
            });

            await Promise.all(emailPromises);
        });

        return { success: true, emailedCount: offlineUsers.length };
    }
);

export const functions = [syncUser, deleteUserFromDB, handleOfflineNotification];

