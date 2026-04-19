# Inngest Configuration - Complete Guide

## 📋 Table of Contents
- [What is Inngest?](#what-is-inngest)
- [File Purpose](#file-purpose)
- [Architecture Overview](#architecture-overview)
- [Detailed Breakdown](#detailed-breakdown)
- [Workflow Diagrams](#workflow-diagrams)
- [Key Concepts](#key-concepts)
- [Real-World Example](#real-world-example)

---

## What is Inngest?

**Inngest** is a background job processing and event-driven orchestration platform. Think of it as a "reliable assistant" that handles tasks automatically when specific events happen in your application, even if your main server is down or busy.

### Simple Analogy
```
Clerk (Auth Service) → Triggers Event → Inngest → Executes Your Code → Updates Database/External Services
```

It's like having a smart middleware that says:
> "When X happens, automatically run Y function, and if it fails, retry later."

---

## File Purpose

**Location:** `backend/src/config/inngest.js`

This file defines **automated workflows** that respond to user events from **Clerk** (authentication service). It ensures that when users sign up or delete their accounts, all related systems (MongoDB, Stream Chat) stay in sync automatically.

### Why This File Exists
1. **Automatic Sync**: No manual intervention needed when users register/delete
2. **Reliability**: If MongoDB is temporarily down, Inngest retries automatically
3. **Decoupling**: Clerk events trigger background jobs without blocking the user experience
4. **Multi-Service Coordination**: Updates multiple systems (DB + Stream Chat) in one go

---

## Architecture Overview

```
┌─────────────────┐
│   Clerk Auth    │ (User signs up)
│     Service     │
└────────┬────────┘
         │ emits event
         ▼
┌─────────────────┐
│  Inngest Cloud  │ (Receives "clerk/user.created")
│   (SaaS)        │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│   Your Server   │ (Runs the function code)
│   (Express)     │
└────────┬────────┘
         │ executes
         ▼
    ┌─────────────┐
    │   syncUser  │ ← Your function defined here
    │  function   │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌───────┐    ┌──────────┐
│MongoDB│    │Stream Chat│
│(User) │    │(Profile) │
└───────┘    └──────────┘
```

---

## Detailed Breakdown

### 1. Inngest Client Initialization

```javascript
export const inngest = new Inngest({ id: "collabhub" });
```

- Creates an Inngest client instance
- `id: "collabhub"` uniquely identifies your app in Inngest's system
- This client is used to define functions that Inngest will execute

### 2. The Two Core Functions

#### Function 1: `syncUser`
**Trigger:** `clerk/user.created` (fires when new user registers via Clerk)

**What it does:**
1. Connects to MongoDB
2. Extracts user data from Clerk event
3. Creates user document in MongoDB
4. Creates user profile in Stream Chat
5. Adds user to public discovery channels

#### Function 2: `deleteUserFromDB`
**Trigger:** `clerk/user.deleted` (fires when user deletes account in Clerk)

**What it does:**
1. Deletes user from MongoDB
2. Deletes user profile from Stream Chat

### 3. Export Statement

```javascript
export const functions = [syncUser, deleteUserFromDB];
```

This array of functions is imported by your Express server and "served" to Inngest so it knows which functions to call when events occur.

---

## Workflow Diagrams

### Workflow 1: New User Signup

```
┌─────────────────┐
│  User Signs Up  │
│   via Clerk     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Clerk emits: "clerk/user.created"     │
│  Event data: {                          │
│    id: "user_123",                     │
│    email_addresses: [{email_address:   │
│      "user@example.com"}],             │
│    first_name: "John",                 │
│    last_name: "Doe",                   │
│    image_url: "https://..."            │
│  }                                     │
└────────┬────────────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Inngest       │
    │  receives      │
    │  event         │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────┐
    │  syncUser function │
    │  EXECUTES          │
    └─────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐    ┌──────────────┐
│ Step A:     │    │ Step B:      │
│ Connect DB  │    │ Extract &    │
└──────┬──────┘    │ Clean Data   │
       │           └──────┬───────┘
       │                  │
       │           ┌──────┴────────────────┐
       │           │ userData = {          │
       │           │   clerkId: "user_123",│
       │           │   email: "...",       │
       │           │   name: "John Doe",   │
       │           │   image: "https://..."│
       │           │ }                     │
       │           └──────────┬────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐    ┌──────────────┐
│ Step C:     │    │ Step D:      │
│ Save to     │    │ Create Stream│
│ MongoDB     │    │ Chat Profile │
│ User.create │    │ upsertStream │
└──────┬──────┘    └──────┬───────┘
       │                  │
       │                  ▼
       │           ┌──────────────┐
       │           │ Step E:      │
       │           │ Add to Pub   │
       │           │ Channels     │
       │           │ addUserTo... │
       │           └──────────────┘
       │
       └───────────[ALL STEPS COMPLETE]───────────┐
                                                │
                               ┌────────────────┴─────────────────┐
                               │                                  │
                               ▼                                  ▼
                    ┌─────────────────┐              ┌──────────────────┐
                    │ Logged Success  │              │  Inngest marks   │
                    │ "✅ User saved" │              │  job COMPLETE    │
                    └─────────────────┘              └──────────────────┘
```

### Workflow 2: User Deletion

```
┌─────────────────┐
│ User Deletes    │
│ Account in      │
│   Clerk         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Clerk emits: "clerk/user.deleted"     │
│  Event data: { id: "user_123" }        │
└────────┬────────────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Inngest       │
    │  receives      │
    │  event         │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────┐
    │ deleteUserFromDB   │
    │  function EXECUTES │
    └─────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐    ┌──────────────┐
│ Step A:     │    │ Step B:      │
│ Connect DB  │    │ Delete from  │
└──────┬──────┘    │ Stream Chat  │
       │           │ deleteStream │
       │           └──────┬───────┘
       │                  │
       └──────────[BOTH DELETED]───────────┐
                                            │
                               ┌────────────┴────────────┐
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │ Logged "🗑️   │         │ Inngest marks│
                        │  User deleted"│        │  job COMPLETE │
                        └──────────────┘         └──────────────┘
```

---

## Key Concepts

### 1. **Event-Driven Architecture**
The file doesn't run continuously. It sits dormant until Clerk sends an event, then Inngest wakes it up.

```javascript
triggers: { event: "clerk/user.created" }
// Wait for this specific event, then run
```

### 2. **Automatic Retries**
If any step fails (e.g., MongoDB is down), Inngest automatically retries with exponential backoff:

```
Attempt 1 → Fail → Wait 10s
Attempt 2 → Fail → Wait 30s  
Attempt 3 → Fail → Wait 2min
... keeps retrying ...
```

### 3. **Try-Catch Error Handling**
All logic is wrapped in `try-catch`. Throwing the error tells Inngest "this failed, please retry":

```javascript
try {
  await User.create(userData);
} catch (error) {
  console.error("Failed to sync:", error);
  throw error; // ← Inngest sees this and retries
}
```

### 4. **Idempotency**
These functions are **idempotent** — running them multiple times with the same input produces the same result. If Inngest retries a `syncUser` job, it won't create duplicate users because:
- `User.create()` with same `clerkId` either creates or updates
- `upsertStreamUser()` is explicitly an "upsert" (update or insert)

---

## Real-World Example

### Scenario: User "alice@example.com" signs up

**Step-by-step execution:**

1. **Alice clicks "Sign up"** in your frontend app
2. **Clerk handles authentication** and creates user `user_abc123`
3. **Clerk emits event** to Inngest:
   ```json
   {
     "type": "clerk/user.created",
     "data": {
       "id": "user_abc123",
       "email_addresses": [{"email_address": "alice@example.com"}],
       "first_name": "Alice",
       "last_name": "Smith",
       "image_url": "https://img.clerk.com/..."
     }
   }
   ```
4. **Inngest receives event** and schedules `syncUser` function
5. **Your Express server** (which imported these functions) executes:
   ```javascript
   // Inside syncUser function:
   const userData = {
     clerkId: "user_abc123",
     email: "alice@example.com",
     name: "Alice Smith",
     image: "https://img.clerk.com/..."
   };
   ```
6. **MongoDB gets new document**:
   ```json
   {
     "_id": "...",
     "clerkId": "user_abc123",
     "email": "alice@example.com",
     "name": "Alice Smith",
     "image": "https://...",
     "createdAt": "2025-04-19T14:50:00Z"
   }
   ```
7. **Stream Chat gets profile**:
   ```json
   {
     "id": "user_abc123",
     "name": "Alice Smith",
     "image": "https://..."
   }
   ```
8. **Alice added to `#general` and `#random`** public channels
9. **Function completes** → Inngest marks job successful

**Result:** Alice can now:
- Log in via Clerk
- See her profile picture in chat
- Access public channels immediately
- All systems are synced automatically

---

## What Happens If Something Fails?

### Example: MongoDB is temporarily down

```
Time 0s:  syncUser starts → tries to connect to MongoDB → FAIL ❌
          Inngest catches error → schedules retry in 10 seconds

Time 10s: syncUser retry → MongoDB still down → FAIL ❌
          Inngest schedules retry in 30 seconds

Time 40s: syncUser retry → MongoDB UP! → SUCCESS ✅
          All steps execute, user fully synced
```

**Alice never knows** there was a problem — she's already using the app while Inngest works in the background.

---

## Integration with Express Server

Your main `server.js` or `app.js` would do something like:

```javascript
import { inngest, functions } from "./config/inngest.js";
import express from "express";

const app = express();

// Serve Inngest functions to Inngest Dev Server / Cloud
app.use("/api/inngest", inngest.serve(functions));

// Your other routes...
```

This exposes an endpoint (`/api/inngest`) that Inngest calls to trigger these functions.

---

## Summary

| Aspect | Details |
|--------|---------|
| **File Type** | Event-driven background job configuration |
| **Trigger Source** | Clerk authentication events |
| **Main Functions** | 1. `syncUser` (on signup) 2. `deleteUserFromDB` (on deletion) |
| **Services Affected** | MongoDB + Stream Chat |
| **Key Feature** | Automatic retries, reliable delivery, no manual sync needed |
| **Pattern** | Event-driven architecture (producer → event → consumer) |

---

## Benefits of This Approach

1. **Separation of Concerns** — Auth logic (Clerk) separate from data sync logic (Inngest)
2. **Resilience** — Failures are automatically retried without user impact
3. **Scalability** — Inngest handles thousands of events concurrently
4. **Observability** — Inngest dashboard shows all job history, failures, retries
5. **Maintainability** — All sync logic in one place, not scattered across routes/middleware

---

## Next Steps

If you want to:
- **Add more events**: Create new `inngest.createFunction()` with different triggers
- **Monitor jobs**: Check Inngest dashboard at https://app.inngest.com
- **Test locally**: Use Inngest Dev Server (`npx inngest dev`)
- **Add more steps**: Extend the `syncUser` function to create default workspace, send welcome email, etc.

---

*Document generated from analysis of `backend/src/config/inngest.js`*
