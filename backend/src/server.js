// IMPORTANT: instrument.js MUST be the very first import.
// It initializes Sentry before anything else loads.
import "../instrument.js";
import * as Sentry from "@sentry/node";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";
import chatRoutes from "./routes/chat.route.js";
import taskRoutes from "./routes/task.route.js";
import userRoutes from "./routes/user.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import activityLogRoutes from "./routes/activityLog.route.js";
import { globalLimiter, apiLimiter } from "./middleware/rateLimiter.middleware.js";

console.time("⏱️ Server Startup");

const app = express();

// ── Security & Rate Limiting ────────────────────────────────────────────────
// helmet() sets a collection of secure HTTP response headers automatically.
// It protects against XSS, clickjacking, sniffing, and other common attacks.
app.use(helmet());

// Apply the global rate limiter to ALL incoming requests.
// This is the first line of defense against bots and abuse.
app.use(globalLimiter);

app.use(express.json());
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'http://localhost:5174'],
  credentials: true
}));
app.use(clerkMiddleware());

// Apply the stricter API rate limiter to all routes under /api/
app.use("/api", apiLimiter);

// --- Routes ---
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/activity", activityLogRoutes);

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
    // Start listening ASAP
    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Server is live on port: ${ENV.PORT}`);
      console.timeEnd("⏱️ Server Startup");
      
      // Initialize DB connection in the background after the server starts
      console.log(`📡 Connecting to MongoDB...`);
      connectDB();
    });
  } catch (error) {
    console.error("❌ Critical error during server startup:", error);
    if (Sentry.captureException) Sentry.captureException(error);
    process.exit(1);
  }
};

startServer();

export default app;