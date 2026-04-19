# Stream Chat Configuration - Complete Guide

## 📋 Table of Contents
- [What is Stream Chat?](#what-is-stream-chat)
- [File Purpose](#file-purpose)
- [Architecture Overview](#architecture-overview)
- [Detailed Breakdown](#detailed-breakdown)
- [Workflow Diagrams](#workflow-diagrams)
- [Token System Explained](#token-system-explained)
- [Real-World Examples](#real-world-examples)
- [Security Considerations](#security-considerations)

---

## What is Stream Chat?

**Stream Chat** is a managed chat API service that provides:
- Real-time messaging (like WhatsApp/CollabHub)
- User profiles and avatars
- Channels/rooms (public, private, messaging)
- reactions, threads, typing indicators
- Moderation tools
- Offline message storage

You integrate it via SDKs (React, React Native, iOS, Android) or raw API.

### Why Use Stream Chat?
- ✅ No need to build chat infrastructure yourself
- ✅ Handles WebSocket connections, offline storage, scaling
- ✅ Built-in features (reactions, replies, mentions)
- ✅ Enterprise-grade reliability

---

## File Purpose

**Location:** `backend/src/config/stream.js`

This file acts as the **backend admin panel** for Stream Chat. It uses the **API Secret** (which should NEVER be exposed to frontend) to perform privileged operations:

### Key Responsibilities
1. **User Identity Sync** — Keep Stream Chat profiles in sync with your MongoDB users
2. **Authentication** — Generate secure tokens for frontend users
3. **Channel Management** — Automatically add users to public channels

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    COLLABHUB BACKEND                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               stream.js (This File)                  │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ • StreamChat Admin Client (API Secret)      │  │  │
│  │  │ • upsertStreamUser()                         │  │  │
│  │  │ • deleteStreamUser()                         │  │  │
│  │  │ • generateStreamToken()                      │  │  │
│  │  │ • addUserToPublicChannels()                  │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ uses API Key + Secret
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STREAM CHAT CLOUD (SaaS)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │   Users    │  │  Channels  │  │   Messages &        │  │
│  │  (Profiles)│  │ (Rooms)    │  │    Reactions        │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SDK connects
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (React/React Native)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Stream Chat React SDK                               │  │
│  │  • Uses token from generateStreamToken()            │  │
│  │  • Connects via WebSocket                           │  │
│  │  • Displays channels, messages, typing indicators   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Breakdown

### 1. Initialization — Stream Admin Client

```javascript
const streamClient = StreamChat.getInstance(
  ENV.STREAM_API_KEY,
  ENV.STREAM_API_SECRET
);
```

| Parameter | Purpose | Where to Find It | Security Level |
|-----------|---------|------------------|----------------|
| `STREAM_API_KEY` | Public identifier (like a username) | Stream Dashboard → API Keys | Can be exposed safely |
| `STREAM_API_SECRET` | Master password for your app | Stream Dashboard → API Keys | **NEVER expose to frontend** |

**Important:** This client has **admin privileges**. It can:
- ✅ Create/delete any user
- ✅ Create/delete any channel
- ✅ Moderate any message
- ✅ Generate tokens for any user

So this code runs **only on the backend server**, never in the browser.

---

### 2. Function: `upsertStreamUser`

**Purpose:** Create or update a user's chat profile.

```javascript
export const upsertStreamUser = async (userData) => {
  const chatUser = {
    ...userData,
    id: userData.id.toString(), // Critical: ID must be string
  };
  await streamClient.upsertUser(chatUser);
};
```

#### Parameters
`userData` object:
```javascript
{
  id: "user_123",           // Your internal user ID (required)
  name: "Alice Smith",      // Display name (optional)
  image: "https://...",     // Avatar URL (optional)
  role: "admin",            // Optional role
  custom: {                 // Custom fields you define
    department: "Engineering",
    onboardingCompleted: true
  }
}
```

#### How Upsert Works
Stream's `upsertUser` is smart:
- If user ID exists → **updates** their profile
- If user ID doesn't exist → **inserts** new user

```javascript
// First call → Creates user
await upsertStreamUser({ id: "user_1", name: "Alice" });
// Result: Stream now has user: { id: "user_1", name: "Alice" }

// Second call → Updates user (no duplicate created)
await upsertStreamUser({ id: "user_1", name: "Alice Smith" });
// Result: User updated: { id: "user_1", name: "Alice Smith" }
```

#### Why `toString()`?
**CRITICAL:** Stream requires `id` as a **string**, not a number or ObjectId.

```javascript
// ❌ WRONG - Will cause errors
upsertStreamUser({ id: ObjectId("507f1f77bcf86cd799439011") });

// ✅ CORRECT - Convert to string
upsertStreamUser({ id: ObjectId("...").toString() });
// Result: { id: "507f1f77bcf86cd799439011" }
```

---

### 3. Function: `deleteStreamUser`

**Purpose:** Permanently remove a user from Stream Chat.

```javascript
export const deleteStreamUser = async (userId) => {
  const idToDelete = userId.toString();
  await streamClient.deleteUser(idToDelete);
};
```

**What happens:**
- User is removed from all channels
- All their messages remain (usually)
- Their user profile is deleted
- They can no longer log in (token becomes invalid)

---

### 4. Function: `generateStreamToken`

**Purpose:** Create a secure "passport" for a user to authenticate with Stream Chat.

```javascript
export const generateStreamToken = (userId) => {
  const token = streamClient.createToken(userId.toString());
  return token; // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
```

**Why tokens?**
Stream Chat uses JWTs (JSON Web Tokens) for authentication. Your frontend cannot use the API secret directly (that would be a security disaster), so:

```
Backend:  Has API Secret (admin privileges) 
          ↓ generates token for specific user
Frontend: Receives token (user-specific, limited permissions)
          ↓ uses token to connect to Stream WebSocket
Stream:   Validates token, allows connection
```

**Token format:**
```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "user_id": "user_123", "exp": 1703016000 }
Signature: HMAC-SHA256(secret + payload)
```

Tokens typically expire in **1 hour** by default. Frontend SDK handles refresh automatically.

---

### 5. Function: `addUserToPublicChannels`

**Purpose:** Automatically subscribe a user to all public/discoverable channels.

```javascript
export const addUserToPublicChannels = async (userId) => {
  // Step 1: Find all public channels
  const publicChannels = await streamClient.queryChannels({
    discoverable: true  // Filter: only public channels
  });

  // Step 2: Add user to each channel
  await Promise.all(
    publicChannels.map(channel => channel.addMembers([userId]))
  );
};
```

#### Channel Discovery Filter

`queryChannels({ discoverable: true })` returns channels where:

```javascript
// Channel creation example (elsewhere in your code):
await streamClient.channel("messaging", "general", {
  name: "General",
  description: "Public community chat",
  discoverable: true  // ← This makes it public
});
```

**Result:** New users automatically join all public channels on signup.

---

## Workflow Diagrams

### Workflow 1: User Signup (Full Flow)

```
┌─────────────────┐
│ User Registers  │
│   (Clerk)       │
└────────┬────────┘
         │
         ▼
  ┌────────────────┐
  │ Inngest Event  │
  │clerk/user.created
  └────────┬───────┘
           │
           ▼
  ┌──────────────────────┐
  │ syncUser Function    │
  │ (inngest.js)         │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ upsertStreamUser()  │ ← stream.js:21
  │ • Stream Chat Admin │
  │ • Upserts profile   │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ addUserToPublicChannels()
  │ • Query public channels
  │ • Add member to each │ ← stream.js:79
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ User Ready in       │
  │ Stream Chat         │
  └──────────────────────┘
```

### Workflow 2: User Login Flow

```
┌─────────────────┐
│ User Logs In    │
│ (Clerk)         │
└────────┬────────┘
         │
         ▼
  ┌────────────────┐
  │ Your API       │
  │ /auth/token    │
  └────────┬───────┘
           │
           ▼
  ┌──────────────────────────┐
  │ generateStreamToken()   │ ← stream.js:63
  │ • Backend creates token │
  │ • Uses API Secret        │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ API Response to Frontend │
  │ { streamToken: "eyJ..."} │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ Frontend Stream SDK     │
  │ const client =          │
  │   StreamChat.getInstance( │
  │     apiKey,             │
  │     token               │ ← User's token
  │   )                     │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ Stream Validates Token  │
  │ • Signature check       │
  │ • Expiry check          │
  │ • User exists check     │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ Connection Established  │
  │ User can now:           │
  │ • Send messages         │
  │ • Join channels         │
  │ • See real-time updates │
  └──────────────────────────┘
```

---

## Token System Explained

### Token Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Has API Secret)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ const token = streamClient.createToken("user_123")  │  │
│  │                                                       │  │
│  │ Token contains:                                      │  │
│  │ {                                                    │  │
│  │   "user_id": "user_123",  ← Who this token belongs  │  │
│  │   "exp": 1703016000,        ← Expiry timestamp      │  │
│  │   "iat": 1703012400         ← Issued at             │  │
│  │ }                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                               │
│                     Sign with HMAC-SHA256                  │
│                     (using API Secret)                    │
│                            ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Generated JWT:                                        │  │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.               │  │
│  │ eyJ1c2VyX2lkIjoidXNlcl8xMjMiLCJleHAiOjE3MDMwMTYwMDB9. │  │
│  │ xyzABC123Signature                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ send to frontend
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Does NOT have API Secret)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ // React Component                                   │  │
│  │ const [chatClient, setChatClient] = useState(null); │  │
│  │                                                       │  │
│  │ useEffect(() => {                                    │  │
│  │   const client = StreamChat.getInstance(            │  │
│  │     process.env.REACT_APP_STREAM_KEY,  // Public Key │  │
│  │     token                                             │  │
│  │   );                                                  │  │
│  │   setChatClient(client);                             │  │
│  │ }, [token]);                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                               │
│                     Connects via WebSocket                  │
│                            ▼                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ WebSocket handshake with JWT
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STREAM CHAT CLOUD                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Token Verification:                                  │  │
│  │ 1. Decode JWT (no secret needed)                    │  │
│  │ 2. Verify signature using API Secret                │  │
│  │ 3. Check expiry date                                │  │
│  │ 4. Check user exists in Stream                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                               │
│                     ┌──────┴──────┐                        │
│                     │             │                        │
│              VALID    │       INVALID                    │
│                     ▼             ▼                        │
│              ┌───────────┐  ┌─────────────┐               │
│              │ Allow     │  │ Reject      │               │
│              │ connection│  │ connection  │               │
│              │ User can  │  │ 401 Error   │               │
│              │ chat!     │  │ Token invalid│              │
│              └───────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-World Examples

### Example 1: Complete User Lifecycle

```javascript
// ========== SIGNUP ==========

// 1. User signs up via Clerk
// 2. Inngest triggers syncUser
import { upsertStreamUser, addUserToPublicChannels } from "../config/stream.js";

// Inside syncUser function:
// a) Create Stream profile
await upsertStreamUser({
  id: user.clerkId,      // "user_abc123"
  name: user.name,       // "Alice Smith"
  image: user.image,     // "https://avatar..."
});

// b) Add to public channels
await addUserToPublicChannels(user.clerkId);
// Result: Alice joins #general, #random, #announcements

console.log("✅ Alice ready to chat!");
```

**Stream Chat now has:**
```json
{
  "id": "user_abc123",
  "name": "Alice Smith",
  "image": "https://...",
  "created_at": "2025-04-19T10:00:00Z"
}
```

---

```javascript
// ========== USER LOGINS ==========

// Frontend asks backend for token
app.get("/api/auth/token", async (req, res) => {
  const token = generateStreamToken(req.user.clerkId);
  res.json({ token });
});

// Frontend receives:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Frontend connects Stream SDK:
const client = StreamChat.getInstance(apiKey, token);
await client.connectUser(
  { id: "user_abc123", name: "Alice Smith" },
  token
);
// ✅ Connected! Alice can now send messages.
```

---

```javascript
// ========== USER DELETES ACCOUNT ==========

// Inngest triggers deleteUserFromDB
import { deleteStreamUser } from "../config/stream.js";

await deleteStreamUser(user.clerkId);
// Result: user_abc123 removed from Stream
// Their messages remain, but profile is gone
```

---

### Example 2: Error Handling in Action

```javascript
// Scenario: Stream API temporarily unavailable

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUser({
      ...userData,
      id: userData.id.toString()
    });
  } catch (error) {
    // Log clearly with context
    console.error(
      `❌ [Stream Admin] Failed to sync user ${userData.id}:`,
      error.message
    );
    
    // Send to Sentry for alerting
    Sentry.captureException(error, {
      tags: { operation: "upsert_user", userId: userData.id }
    });
    
    // Re-throw so Inngest knows to retry
    throw error;
  }
};
```

**What Inngest sees:**
```
❌ syncUser job failed with error: 
  Error: connect ECONNREFUSED 127.0.0.1:9000
  at ...
  
🔁 Inngest: Retrying in 10 seconds...
```

---

### Example 3: Custom User Fields

```javascript
// You can add custom metadata that Stream stores:
await upsertStreamUser({
  id: "user_123",
  name: "Bob",
  image: "https://...",
  role: "moderator",       // Built-in field
  custom: {                // Your custom fields
    subscription: "premium",
    expertise: ["react", "nodejs"],
    timezone: "UTC+5:30",
    onboardingStep: 3
  }
});

// Later query users by custom fields:
const moderators = await streamClient.queryUsers({
  "custom.role": "moderator"
});
// Returns: [{ id: "user_123", name: "Bob", ... }]
```

---

## Security Considerations

### 1. API Secret Protection

```javascript
// ✅ CORRECT - From Environment Variables
const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET  // From .env, never committed
);

// ❌ WRONG - Hardcoded secrets
const streamClient = StreamChat.getInstance(
  "sk_live_123456789",           // API Key
  "sk_live_secret_abc123xyz"     // EXPOSED IN CODE! 🚨
);
```

**Consequence of exposing API Secret:**
- Anyone can delete all users
- Anyone can read all messages
- Anyone can impersonate any user
- **Full data breach**

### 2. Token Security

Tokens are short-lived (1 hour default). Frontend SDK handles auto-refresh.

If a token is leaked:
- Attacker can impersonate that user only (limited damage)
- Token expires in 1 hour
- You can revoke all tokens via Stream dashboard

### 3. User ID Sanitization

Always convert IDs to strings:

```javascript
// MongoDB ObjectId → String
const userId = mongodbUser._id.toString();

// Clerk ID (already string) → still call toString()
const userId = clerkUserId.toString(); // Safe
```

Without this, Stream throws: `Error: User id must be a string`

---

## Common Gotchas & Solutions

| Problem | Solution |
|---------|----------|
| `TypeError: Cannot read property 'discoverable' of undefined` | No public channels exist yet. Create one first with `{ discoverable: true }` |
| User doesn't appear in channel after `addMembers()` | Call `channel.create()` first before adding members |
| Token generation fails | Ensure `userId` is a string, not ObjectId |
| User profile not updating | `upsertUser` overwrites entire object. Merge existing custom fields: `...existingUser.custom, ...newCustom` |
| Messages not sending | Frontend must call `client.connectUser()` first with valid token |

---

## Testing Locally

Use Stream's **dev environment** to avoid polluting production data.

In `.env`:
```
STREAM_API_KEY=dev_key_abc123
STREAM_API_SECRET=dev_secret_xyz789
```

Benefits:
- Isolated test data
- No rate limits
- Safe to delete/create freely

---

## Summary

| Function | Purpose | Called From | Side Effects |
|----------|---------|-------------|--------------|
| `upsertStreamUser` | Create/update chat profile | Inngest `syncUser` | Stream DB: +1 user |
| `deleteStreamUser` | Delete user + remove from channels | Inngest `deleteUserFromDB` | Stream DB: -1 user |
| `generateStreamToken` | Generate auth JWT | Your auth routes | None (readonly) |
| `addUserToPublicChannels` | Auto-join public channels | Inngest `syncUser` | Channel membership updates |

---

## Integration Checklist

When wiring this up:

- [ ] `npm install stream-chat @sentry/node`
- [ ] Add `STREAM_API_KEY` and `STREAM_API_SECRET` to `.env`
- [ ] Import functions in `inngest.js`:
  ```javascript
  import {
    upsertStreamUser,
    addUserToPublicChannels,
    deleteStreamUser
  } from "./stream.js";
  ```
- [ ] Create at least one public channel in your app with `{ discoverable: true }`
- [ ] Test signup flow: user → MongoDB + Stream sync
- [ ] Test token endpoint: frontend can connect to Stream
- [ ] Verify in Stream Dashboard: users appear, can send messages

---

## Next Steps

- **Add direct messaging:** Use `channel.type = "messaging"` for 1:1 chats
- **Add reactions:** Use `message.react("like")` SDK method
- **Add typing indicators:** `channel.keystroke()` on input
- **Add message moderation:** Webhook to moderate flagged content
- **Add file uploads:** Stream provides CDN for images/videos

---

*Document generated from analysis of `backend/src/config/stream.js`*
