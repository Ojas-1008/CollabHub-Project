// Import the StreamChat library to handle chat features
import { StreamChat } from "stream-chat";
import * as Sentry from "@sentry/node";
// Import environment variables like API keys
import { ENV } from "../config/env.js";

// Initialize the Stream Chat client with your API Key and Secret
const streamClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

/**
 * Creates or updates a user in the Stream Chat system.
 * @param {Object} userData - Information about the user (e.g., id, name, image)
 */
export const upsertStreamUser = async (userData) => {
    try {
        // "Upsert" means update if exists, otherwise create new
        await streamClient.upsertUser(userData);
        console.log("Stream user upserted successfully:", userData.name);
        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error);
        Sentry.captureException(error);
        throw error;
    }
};

/**
 * Removes a user from the Stream Chat system.
 * @param {string} userId - The unique ID of the user to delete
 */
export const deleteStreamUser = async (userId) => {
    try {
        await streamClient.deleteUser(userId);
        console.log("Stream user deleted successfully:", userId);
    } catch (error) {
        console.error("Error deleting Stream user:", error);
        Sentry.captureException(error);
        throw error;
    }
};

/**
 * Generates a secure token for a user to log into the chat.
 * @param {string|number} userId - The ID of the user requesting a token
 * @returns {string|null} - The generated token or null if it fails
 */
export const generateStreamToken = (userId) => {
    try {
        // Ensure the ID is a string, then create a login token
        const userIdString = userId.toString();
        return streamClient.createToken(userIdString);
    } catch (error) {
        console.error("Error generating Stream token:", error);
        Sentry.captureException(error);
        throw error;
    }
};

/**
 * Finds all public channels and adds a new user to them automatically.
 * @param {string} newUserId - The ID of the user to add
 */
export const addUserToPublicChannels = async (newUserId) => {
    try {
        // Find channels that are marked as "discoverable" (public)
        const publicChannels = await streamClient.queryChannels({ discoverable: true });
        
        // Add the user to every public channel found
        await Promise.all(publicChannels.map(channel => channel.addMembers([newUserId])));
        
        console.log(`Added user ${newUserId} to ${publicChannels.length} public channels`);
    } catch (error) {
        console.error("Error adding user to public channels:", error);
        Sentry.captureException(error);
    }
};