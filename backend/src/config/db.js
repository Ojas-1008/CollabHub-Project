import mongoose from "mongoose";
import * as Sentry from "@sentry/node";
import {ENV} from "./env.js";

export const connectDB = async () => {
    // If we're already connected, don't try to connect again.
    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const conn = await mongoose.connect(ENV.MONGO_URI, {
            // Force IPv4 to avoid slow DNS lookups on some systems (common issue)
            family: 4,
            // Reduce the time it takes to realize the server is unreachable
            serverSelectionTimeoutMS: 5000, 
        });
        console.log("🚀 MongoDB connected: ", conn.connection.host);
    } catch (error) {
        console.error("❌ Error connecting to MongoDB: ", error.message);
        Sentry.captureException(error);
        
        // In local development, we might not want to crash the whole app 
        // immediately if the DB is down, but for safety we'll keep the exit.
        process.exit(1);
    }
}