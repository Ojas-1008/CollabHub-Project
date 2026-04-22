import rateLimit from "express-rate-limit";

/**
 * 🛡️ RATE LIMITERS — The "Bouncer" for our API
 *
 * A rate limiter watches how many requests a single IP address makes.
 * If they send too many requests in a short time, we block them temporarily.
 *
 * WHY THIS MATTERS:
 *  - Prevents brute-force attacks (trying passwords over and over)
 *  - Prevents bots from spamming your API endpoints
 *  - Protects your MongoDB from being overwhelmed with queries
 *
 * HOW IT WORKS:
 *  - `windowMs`: The time window to track requests (in milliseconds)
 *  - `max`: The maximum number of requests allowed in that window
 *  - After hitting the limit, the user gets a 429 "Too Many Requests" error
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBAL LIMITER — Applied to every single route
//    Allows 200 requests per 15 minutes. A generous limit to avoid blocking
//    normal users, but still stops bots running thousands of requests.
// ─────────────────────────────────────────────────────────────────────────────
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (in milliseconds)
    max: 200,                  // Max 200 requests per window
    standardHeaders: true,     // Sends rate limit info in standard `RateLimit-*` headers
    legacyHeaders: false,      // Disables the older `X-RateLimit-*` headers
    message: {
        status: 429,
        message: "Too many requests. Please slow down and try again in 15 minutes.",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. API LIMITER — Applied to all /api/* routes
//    Slightly stricter — caps API calls at 100 per 15 minutes.
//    This is the main defense for your data endpoints.
// ─────────────────────────────────────────────────────────────────────────────
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // Max 100 API requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many API requests. Please wait before making more requests.",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUTH LIMITER — Applied only to the token/authentication endpoint
//    The strictest limiter. Only 20 requests per 15 minutes.
//    This is critical to prevent someone from hammering your auth endpoint
//    to farm tokens or stress-test your backend auth system.
// ─────────────────────────────────────────────────────────────────────────────
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // Max 20 auth requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    },
});
