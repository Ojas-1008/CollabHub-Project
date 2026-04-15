import mongoose from "mongoose";
import * as Sentry from "@sentry/node";
import {ENV} from "./env.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(ENV.MONGO_URI);
        console.log("MongoDB connected successfully: ", conn.connection.host);
    } catch (error) {
        console.log("Error connecting to MongoDB: ", error);
        Sentry.captureException(error);
        process.exit(1);
    }
}