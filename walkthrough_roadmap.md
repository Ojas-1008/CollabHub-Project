# 🗺️ CollabHub Project Walkthrough Roadmap

This document serves as your guide to mastering the CollabHub codebase. Use this as a "cheat sheet" for your professor's demo to explain *why* and *how* things work.

---

## 🏛️ Stage 1: The Big Picture (Architecture)
**Objective:** Explain how the frontend and backend talk to each other and why we chose specific external services.

- **Stack Overview**: 
    - **Frontend**: React (Vite) + Tailwind CSS + Stream SDK.
    - **Backend**: Node.js (Express) + MongoDB (Mongoose).
- **Service Hubs**:
    - **Identity**: Clerk (Auth)
    - **Messaging**: Stream Chat (Real-time)
    - **Background Jobs**: Inngest (Reliability)
    - **Monitoring**: Sentry (Error tracking)

---

## 🔄 Stage 2: The User Journey (Data Sync)
**Objective:** Master the complex flow of a user "signing up" until they appear in the chat.

- **The Webhook Loop**:
    1.  User signs up via **Clerk**.
    2.  Clerk sends a "Webhook" (a notification) to our Backend.
    3.  **Inngest** catches that notification and runs a background job.
    4.  The job creates the user in **MongoDB**.
    5.  The job then "Upserts" (creates/updates) the user in **Stream Chat**.
    6.  The job automatically adds the user to public channels.

---

## 💬 Stage 3: The Real-time Engine (Messaging)
**Objective:** Explain how messages move across the screen instantly.

- **Frontend Connection**: How `useStreamChat.js` initializes the connection.
- **Security**: The "Token" system. The backend signs a JWT (JSON Web Token) so Stream knows the user is legit.
- **TanStack Query**: How we efficiently fetch and cache the chat token using `frontend/lib/api.js`.

---

## 🛡️ Stage 4: Professional Rigor (Tooling)
**Objective:** Show that this isn't just a "tutorial project" but a production-ready app.

- **Observability**: How `instrument.js` (Backend) and `main.jsx` (Frontend) use **Sentry** to catch bugs before users report them.
- **Environment Safety**: Centralized configuration in `backend/src/config/env.js`.
- **Refactoring**: Why we moved from "Messenger Style" logic to a "Beginner Friendly" linear pattern (as seen in `development_log.md`).

---

## 🛠️ Stage 5: Development History (The "Grit")
**Objective:** Prove you built this by explaining the challenges you overcam.

- **Windows Compatibility**: Fixes for shell execution and environment variables.
- **Import Struggles**: How you fixed pathing issues between `frontend/src` and `frontend/lib`.
- **Initialization Order**: Why Sentry must be the *first* thing loaded in the app.

---

> [!TIP]
> **Pro-Tip for the Demo:** 
> When your professor asks "What was the hardest part?", talk about the **Inngest Webhook Sync**. It bridges three different platforms (Clerk, your DB, and Stream) and ensures that even if one service is slow, the others eventualy catch up!
