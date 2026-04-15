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

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);

app.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

Sentry.setupExpressErrorHandler(app);

const startServer = async () => {
    try {
      await connectDB();
  
      app.listen(ENV.PORT, () => {
        console.log("Server started on port:", ENV.PORT);
      });
    } catch (error) {
      console.error("Error starting server:", error);
      Sentry.captureException(error);
      process.exit(1); 
    }
  };

  startServer();

export default app;