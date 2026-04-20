// IMPORTANT: instrument.js MUST be the very first import.
// It initializes Sentry before anything else loads.
import "../instrument.js";
import * as Sentry from "@sentry/node";
import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";
import chatRoutes from "./routes/chat.route.js";
import taskRoutes from "./routes/task.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();

app.use(express.json());
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'http://localhost:5174'],
  credentials: true
}));
app.use(clerkMiddleware());

// --- Routes ---
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// IMPORTANT: Sentry error handler MUST come after all routes
// but BEFORE the server starts listening.
Sentry.setupExpressErrorHandler(app);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log("Server started on port:", ENV.PORT);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    // Guard: only call Sentry if it was initialized successfully
    if (Sentry.captureException) Sentry.captureException(error);
    process.exit(1);
  }
};

startServer();

export default app;