import * as Sentry from "@sentry/node";
import { ENV } from "./src/config/env.js";

const isDev = (ENV.NODE_ENV || "development") === "development";

Sentry.init({
    dsn: ENV.SENTRY_DSN,
    // Reduce noise and speed up startup in development
    tracesSampleRate: isDev ? 0.1 : 1.0,
    profilesSampleRate: isDev ? 0 : 1.0, 
    environment: ENV.NODE_ENV || "development",
    includeLocalVariables: true,
    sendDefaultPii: true,
});