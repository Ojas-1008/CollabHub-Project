import { StreamChat } from "stream-chat";
import * as Sentry from "@sentry/node";
import { ENV } from "../config/env.js";

/**
 * SERVICE OVERVIEW:
 * This file acts as our backend "Admin" for Stream Chat. 
 * Because we use the API_SECRET here, this client has full power to 
 * create users, delete users, and generate secure login tokens.
 */
export const streamClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

// ==========================================
// SECTION 1: IDENTITY SYNC
// Keeping the Chat profiles in sync with our DB
// ==========================================

/**
 * Upsert (Update or Insert) a user profile in Stream Chat.
 */
export const upsertStreamUser = async (userData) => {
    try {
        // Prepare the data (Ensuring ID is a string is critical for Stream)
        const chatUser = {
            ...userData,
            id: userData.id.toString(),
        };

        await streamClient.upsertUser(chatUser);
        console.log(`✅ [Stream Admin] Synced profile for: ${chatUser.name}`);
        return chatUser;
    } catch (error) {
        console.error("❌ [Stream Admin Error] Failed to sync user profile:", error);
        Sentry.captureException(error);
        throw error;
    }
};

/**
 * Permanently remove a user from Stream Chat.
 */
export const deleteStreamUser = async (userId) => {
    try {
        const idToDelete = userId.toString();
        await streamClient.deleteUser(idToDelete);
        console.log(`🗑️ [Stream Admin] Deleted profile for ID: ${idToDelete}`);
    } catch (error) {
        console.error("❌ [Stream Admin Error] Failed to delete user profile:", error);
        Sentry.captureException(error);
        throw error;
    }
};

// ==========================================
// SECTION 2: ACCESS & ONBOARDING
// Handling tokens and channel memberships
// ==========================================

/**
 * Creates a "Passport" (Token) for the user.
 * The user shows this token to the Chat SDK on the frontend to prove who they are.
 */
export const generateStreamToken = (userId) => {
    try {
        const id = userId.toString();
        const token = streamClient.createToken(id);
        console.log(`🔑 [Stream Admin] Generated secure token for user: ${id}`);
        return token;
    } catch (error) {
        console.error("❌ [Stream Admin Error] Failed to create token:", error);
        Sentry.captureException(error);
        throw error;
    }
};

/**
 * Automatically joins a user to every 'public' channel in the app.
 */
export const addUserToPublicChannels = async (userId) => {
    try {
        const id = userId.toString();

        // Step 1: Find all channels that are marked as "discoverable" (public)
        const publicChannels = await streamClient.queryChannels({ 
            discoverable: true 
        });

        if (publicChannels.length === 0) {
            console.log("ℹ️ [Stream Admin] No public channels found to join.");
            return;
        }

        // Step 2: Add the user to every channel we found
        await Promise.all(
            publicChannels.map((channel) => channel.addMembers([id]))
        );
        
        // Log exactly which channels they joined for easier debugging
        const channelNames = publicChannels.map(c => c.data.name || c.id).join(", ");
        console.log(`📢 [Stream Admin] Added user ${id} to public channels: [${channelNames}]`);
        
    } catch (error) {
        console.error("❌ [Stream Admin Error] Failed to add user to public channels:", error);
        Sentry.captureException(error);
    }
};