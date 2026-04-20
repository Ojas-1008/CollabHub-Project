# Development Log - CollabHub Project

This log tracks the progress, decisions, and changes made to the CollabHub project codebase.

## [2026-04-12] - Project Setup and Initialization

### Added
- **Backend Infrastructure**: Initialized an Express.js server in `/backend`.
  - Configured `server.js` with a basic "Hello World" route and port listener.
  - Setup environment variable management using `dotenv`.
  - Added `mongoose` as a dependency for upcoming database integration.
- **Frontend Infrastructure**: Initialized a Vite + React project in `/frontend`.
  - Default starter template with React logos and counter logic.
- **Git Integration**: 
  - Created a root-level `.gitignore` to exclude `node_modules`, `.env`, and build artifacts.
  - Initialized Git and connected the repository to [GitHub](https://github.com/Ojas-1008/CollabHub-Project.git).

### Fixed
- **Backend Configuration**: Fixed a bug in `backend/src/config/env.js` where `NODE_ENV` was incorrectly mapped to `process.NODE_ENV` instead of `process.env.NODE_ENV`.

## [2026-04-13] - Database Integration and Expanded Configuration

### Added
- **Database Connection**: Created `backend/src/config/db.js` to handle MongoDB connections using Mongoose.
- **Environment Variables**: Expanded `backend/src/config/env.js` with keys for:
  - **Clerk**: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - **Sentry**: `SENTRY_DSN`
  - **Inngest**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **Server Startup**: Updated `backend/src/server.js` to call `connectDB()` upon server start.

## [2026-04-14] - Authentication Integration and Frontend Refinement

### Added
- **Authentication (Frontend)**: Integrated Clerk for user authentication.
  - Configured `ClerkProvider` in `main.jsx` using `VITE_CLERK_PUBLISHABLE_KEY`.
  - Implemented `SignInButton`, `SignUpButton`, and `UserButton` in `App.jsx`.
  - Added conditional rendering of authentication components based on user session state.
- **Backend Middleware**: Added `@clerk/express` middleware to the Express server in `server.js` to handle authentication context.
- **User Model**: Defined the `User` schema in `backend/src/models/user.model.js` with `clerkId`, `email`, `name`, and `image` fields.
- **Inngest Webhooks**: Implemented webhook handlers in `backend/src/config/inngest.js` to sync user data from Clerk.
  - Added `sync-user` function to handle `clerk/user.created` events.
  - Added `delete-user-from-db` function to handle `clerk/user.deleted` events.

### Changed
- **Frontend Refinement**: Removed Vite default boilerplate (counter state, logos, and styles) to establish a clean slate for CollabHub development.
- **Backend Debugging**: Added temporary logging in `backend/src/server.js` to verify `MONGO_URI` connection strings during initialization.

### Fixed
- **Syntax Errors**: Fixed a syntax error in `inngest.js` where `await connectDB()` was incorrectly followed by a code block.
- **Clerk Data Mapping**: Fixed an issue where `email_address` was incorrectly accessed as `email_addresses`.

### Refinement
- **Backend Refinement**: 
  - Fixed a `ReferenceError` in `backend/src/config/inngest.js` where `id` was undefined.
  - Corrected a typo in `backend/src/server.js` (`server` -> `serve`).
  - Updated Inngest functions to v4 syntax.
  - Verified successful MongoDB connection and server startup on port 5001.

## [2026-04-15] - Stream Chat Integration, Real-time Communication, and Frontend Refinement

### Added
- **GetStream Integration (Backend)**:
  - Created `backend/src/config/stream.js` to initialize the Stream Chat server client.
  - Implemented utility functions: `upsertStreamUser`, `deleteStreamUser`, `generateStreamToken`, and `addUserToPublicChannels`.
- **User Sync Enhancement**:
  - Enhanced Inngest webhooks to automatically sync users with Stream Chat when created or deleted in Clerk.
  - New users are now automatically added to discoverable public channels upon creation.
- **Chat API**:
  - Implemented `/api/chat/token` route to provide secure access tokens for the frontend.
  - Created `chat.controller.js` and `chat.route.js` to manage chat-related requests.
- **Frontend Infrastructure Improvements**:
  - Integrated `@sentry/react` for frontend error tracking and browser tracing with React Router v7 integration.
  - Added `react-router` for declarative navigation.
  - Integrated `@tanstack/react-query` for server-state management.
  - Integrated `react-hot-toast` for application-wide notifications.
  - Initialized `frontend/src/providers/AuthProvider.jsx` as a skeleton for future auth/chat logic.
- **Middleware**:
  - Added `protectRoute` middleware in `backend/src/middleware/auth.middleware.js` to secure chat endpoints.

### Documentation
- **Stream Integration**: Created `backend/src/config/stream_explanation.md` featuring detailed architectural breakdowns, function explanations, and Mermaid flow diagrams for onboarding and authentication processes.

### Fixed
- **Windows Compatibility**: Fixed an issue where `NODE_OPTIONS` syntax in `package.json` was crashing on Windows. Switched to cross-platform `node --import` flag.
- **Script Errors**: Corrected the file extension from `.mjs` to `.js` for `instrument.js` in development scripts.
- **Server Crashes**: Fixed `ReferenceError: Sentry is not defined` in `server.js` by adding the missing import.
- **Error Handling**: Fixed an issue in `stream.js` where token generation would return `null` on failure; it now correctly throws errors for the controller to handle.

### Refinement
- **Monitoring**: 
    - Integrated `Sentry.captureException` across `server.js`, `stream.js`, and `db.js` for better error visibility.
    - Optimized Sentry middleware positioning in Express to ensure full coverage.
- **Connectivity**: Added `cors()` middleware to `server.js` to allow communication with the frontend.
- **Database**: Added Sentry reporting to the MongoDB connection logic.

### Changed
- **Server Entry Point**: Updated `backend/src/server.js` to include chat routes and simplified server startup logic.
- **Environment Configuration**: Added `STREAM_API_KEY` and `STREAM_API_SECRET` to `backend/src/config/env.js` and `VITE_SENTRY_DSN` to frontend environments.

## [2026-04-16] - Authentication UI/UX and Secure Chat Connection

### Added
- **Authentication (Frontend UI)**:
  - Developed a premium, high-fidelity `AuthPage.jsx` featuring:
    - **Modern Aesthetics**: Glassmorphic design with vibrant gradients and dark/light mode compatibility.
    - **Dynamic Animations**: Staggered feature item entrance, pulse effects for CTA buttons, and slide-in transitions.
    - **Functional Enhancements**: Interactive loading states for signing in and integrated error notification handling.
    - **Responsive Layout**: Two-column responsive design with hero copy and visual brand elements.
  - Created `frontend/src/styles/auth.css` for centralized UI tokens and custom animations.
- **Secure Chat Integration**:
  - Fully implemented `frontend/src/providers/AuthProvider.jsx`:
    - Logic for fetching short-lived Stream Chat tokens from the backend using Clerk authentication context.
    - Automatic connection management: connects user on login and disconnects on logout.
    - Provides application-wide `chatClient` via the `useChat` custom hook.
- **Frontend Infrastructure**:
  - Updated `index.html` with SEO-friendly meta tags, project-specific branding, and favicon links.
  - Added `stream-chat-react` as a dependency in `package.json` to prepare for SDK-based UI components.
- **Dashboard Refinement**:
  - Updated `HomePage.jsx` to include a live connection status indicator showing the Stream Chat integration state.

### Changed
- **Dependencies**: Updated `package.json` with `@stream-chat-react` and verified latest versions for core libraries.

### Refinement
- **Asset Management**: Initialized `frontend/public/` directory for application-wide static assets (logos, hero images).
- **Error Handling**: Enhanced the Auth flow with visual error states and interactive "Close" triggers for failure notifications.

## [2026-04-17] - Infrastructure Stabilization and Logic Refactoring

### Fixed
- **Sentry Initialization (Backend)**: Resolved `ReferenceError: Sentry is not defined` in `server.js` by refactoring the initialization sequence and adding null-guards to cleanup the startup logic.
- **Import Synchronization (Frontend)**: 
  - Corrected `@clerk/clerk-react` imports to `@clerk/react` across `main.jsx` and `AuthProvider.jsx` to align with `package.json`.
  - Fixed `BrowserRouter` import in `main.jsx` to target `react-router-dom` for proper web-browser compatibility in React Router v7.

### Added
- **API Client (Axios)**: 
  - Created `frontend/lib/axios.js` to centralize backend communication settings and environment variables.
  - Implemented automatic JWT token injection via Axios request interceptors in `AuthProvider.jsx`, ensuring all backend requests are securely authenticated without manual prop-drilling of tokens.

### Changed
- **Logic Refactoring (Beginner Friendly)**:
  - **AuthProvider.jsx**: Completely refactored the underlying logic from deeply nested effects into a linear "Scenario Manager" pattern. 
  - **App.jsx**: Refactored the main routing structure to prioritize readability.
  - **inngest.js**: Refactored background task logic to include step-by-step instructions and explicit error handling (Step 1-5 markers).
  - **stream.js**: Overhauled Stream configuration to include a "Service Overview" and enforced string-safety for all user IDs.

### Refinement
- **Observability**: Integrated consistent, emoji-coded terminal logs (✅, 🗑️, 🔑, 📢) across all core backend integration files to make background processes visible and easy to debug.
- **Git Workflow**: Consolidated all structural fixes and refactors into a single migration commit and pushed to the remote repository.
## [2026-04-19] - Frontend Hook Refactoring and API Centralization

### Added
- **Frontend API Library**: Created `frontend/lib/api.js` to centralize chat-related API calls, starting with the `getStreamToken` function for fetching chat access tokens.
- **Custom Hook (`useStreamChat`)**: Implemented a custom hook to manage the lifecycle of the Stream Chat client. This hook integrates `@tanstack/react-query` for efficient token management and handles real-time connection/disconnection logic.

### Changed
- **Logic Refactoring (Beginner Friendly)**:
  - **useStreamChat.js**: Completely refactored the hook logic to follow a linear, step-by-step "Connect User" flow. This makes the complex process of initializing real-time services easier to follow for students while still using pro-level tools like TanStack Query.
  - **HomePage.jsx**: Refactored to use semantic HTML (`aside`, `main`) and a cleaner state-to-URL synchronization. Added a friendly "empty state" for better user experience when no channel is selected.
  - **CustomChannelModal.jsx**: Overhauled the channel creation flow. Simplified member selection, added a live "Channel ID" preview, and improved form validation logic to be more linear and readable.
  - **Code Simplification**: Replaced complex nullish coalescing chains with straightforward logical fallbacks across all active components.

### Fixed
- **Import Path Synchronization**: Resolved multiple path mismatches in internal imports between `frontend/src` and `frontend/lib`, ensuring the hook correctly references core API utilities.
- **Dependency Missing**: Fixed a startup error by installing `lucide-react` for frontend icons.
- **Clerk Package Alignment**: Corrected `@clerk/clerk-react` imports to `@clerk/react` project-wide to match legacy dependency mappings.
- **Missing Styles**: Created `stream-chat-theme.css` to provide a consistent modern look for the chat dashboard and resolve Vite import errors.
- **Provider Simplification**: Refactored `AuthProvider.jsx` to focus exclusively on the Axios request interceptor, removing redundant and conflicting chat connection logic. Fixed incorrect relative paths for global library imports.
- **HomePage Cleanup**: Simplified the main dashboard by reverting to standard Stream SDK components (`ChannelHeader`, `ChannelList` defaults) to minimize custom code footprint and improve stability.
- **Auth UX Fix**: Removed a dummy error simulation in `AuthPage.jsx` that was triggered by a timer, resolving the "Unable to connect" message that appeared while users were using the sign-in modal.
- **CORS Resolution**: Updated backend CORS configuration to explicitly allow `http://localhost:5173` with `credentials: true`. This fixes the preflight failure caused by Axios using `withCredentials` for session sharing.
- **Beginner-Friendly Refactor & Side-Bar Integration**:
  - **CustomChannelPreview.jsx**: Simplified CSS string manipulation and callback logic to follow a step-by-step student approach.
  - **UsersList.jsx**: Refactored the direct messaging list to remove abstract hooks and split logic into clearly labeled variables. Fixed a "shadow-lg" typo and standardized casing.
  - **HomePage.jsx**: Integrated the `UsersList` into the sidebar to enable Direct Messaging functionality. Standardized headers and icons across the dashboard.
  - **CustomChannelModal.jsx**: Structured form state and submission logic into linear "steps" for better educational clarity.
  - **Filesystem Resolution**: Fixed a critical build error caused by case-insensitivity conflicts in filename casing (`CustomChannelPreview.jsx`).
- **UI/UX Chat Overhaul (SLAP Aesthetic)**:
  - Developed a custom CSS architecture in `stream-chat-theme.css` to bypass Stream SDK's default grid layouts which were causing text alignment and item stretching issues.
  - Implemented the **"ch-item" class system** in `CustomChannelPreview` and `UsersList` for consistent, capsule-styled sidebar items.
  - **Premium Header**: Overhauled `ChannelHeader` with a taller profile, richer typography, and gradient-styled avatars.
  - **Enhanced Messaging**:
    - Implemented Indigo-to-Purple gradients for outgoing message bubbles with soft drop-shadows.
    - Redesigned "Deleted Message" states with a subtle ghostly background and dashed borders.
    - Fully refactored `MessageInput` styling to include interactive icons (rotating plus button on hover) and a vibrant send button with drop-shadow effects.
  - **Layout Refinement**:
    - Resolved "white box" bleeding in the sidebar by forcing aggressive background transparency on Stream SDK's internal wrappers.
    - Centered "Empty State" UI in the main chat area with refined typography for better readability against white backgrounds.
    - Fixed vertical "text-squishing" in message bubbles by implementing a safer `inline-block` layout strategy.
- **Verification**: Successfully tested the entire end-to-end flow: User SignUp via Clerk → Automated DB Sync → Secure Stream Chat Token Generation → Real-time Messaging on Dashboard. All systems verified and stable with high-fidelity UI.

## [2026-04-20] - Messaging UI Polishing and Git Sync

### Fixed
- **Messaging UI Artifacts**: 
  - Hidden the default black error icon (`.str-chat__message-error-icon`) that incorrectly appeared inside sent message bubbles.
  - Fixed text "bleeding" and overflow issues for long unbroken strings by implementing `overflow: hidden` and `word-break: break-all` on message bubbles.
  - Resolved unstyled timestamp and read receipt alignment by targeting the correct Stream SDK metadata classes.
  - Collapsed the empty reactions container to prevent unnecessary vertical spacing in message rows.
  - **InviteModal Fix**: Corrected a state synchronization issue by making member selection checkboxes fully controlled components.
  - **Avatar Fallbacks**: Implemented initial-based fallback avatars in `MembersModal` and `PinnedMessagesModal` to prevent missing images from breaking the UI layout.

### Changed
- **UX Optimization**: Refactored message action buttons (react, reply, options) to be hidden by default and fade in only on hover, significantly reducing visual noise in the chat history.
- **Code Refactoring (Contextual)**: Overhauled `CustomChannelHeader.jsx`, `InviteModal.jsx`, `MembersModal.jsx`, and `PinnedMessagesModal.jsx` to follow a linear, beginner-friendly architecture with extensive inline documentation.
- **Git Workflow**: 
  - Successfully synchronized local UI fixes with the remote repository.
  - Manually resolved code conflicts in `stream-chat-theme.css` during a rebase-push cycle.

### Refinement
- **UI Stability**: Strengthened the flexbox architecture of message rows to ensure they remain responsive even with extremely large batches of text or oddly shaped media.
- **Educational Documentation**: Integrated numbered step comments across all core header and modal components, making the complex Stream SDK interactions transparent for developers.

## [2026-04-20] - Shared File Explorer Implementation

### Added
- **Shared File Explorer Feature**:
  - **`useChannelFiles` Hook**: A custom hook that queries Stream Chat for messages containing attachments. Implements pagination and flattens data into a clean, UI-ready file list.
  - **`FileCard` Component**: Individual file cards with smart icons (PDF, Image, Code), size formatting, and download/jump actions.
  - **`FileExplorer` Drawer**: A premium glassmorphic sidebar that serves as a centralized dashboard for all channel attachments. Includes filter tabs (All, Images, Docs, Links) and infinite-scroll pagination.
- **Enhanced Navigation**:
  - **Jump to Message**: Integrated URL-based message highlighting. When a user clicks "Jump" in the File Explorer, the chat automatically scrolls to and highlights that specific message using `highlightedMessageId`.
- **Header Integration**: Added a dedicated "Files" button to `CustomChannelHeader` with active-state highlighting.

### Refinement
- **UI/UX**: Maintained the "SLAP" aesthetic with `backdrop-blur-2xl` and consistent purple-tinted glass surfaces.
- **Documentation**: Added comprehensive, beginner-friendly inline comments to all new files (`useChannelFiles.js`, `FileCard.jsx`, `FileExplorer.jsx`).

### Task List
- [x] Implement MongoDB connection logic using Mongoose.
- [x] Replace Vite boilerplate with authentication components.
- [x] Define User model and implement basic CRUD logic for Clerk syncing.
- [x] Integrate Inngest with Express server for webhook processing.
- [x] Verify MongoDB Atlas connection and server startup.
- [x] Set up basic API routes and controllers in the backend.
- [x] Add `cors()` middleware to the backend.
- [x] Set up frontend infrastructure (Router, Sentry, Query Client, Toast).
- [x] Integrate Stream Chat React SDK on the frontend.
- [x] Implement core dashboard components (Channel list, Message window).
- [x] Implement form validation on both client and server sides.
- [x] Implement AuthProvider logic and secure token handling.
- [x] Design and implement the primary dashboard layout with custom "SLAP" aesthetic.
- [ ] Build a comprehensive profile management page.
- [x] Define Task model for message-to-task integration.
- [x] Implement Backend API routes and controllers for Task management.
- [x] Build the TaskModal UI components.
- [x] Connect the "Create Task" button to the Stream Chat message list.
- [x] Build the Channel Task List drawer in the dashboard.
- [x] Build the Shared File Explorer sidebar with filtering and pagination.

## [2026-04-20] - Task Integration Feature ("The Action Gap Solver")

### Added
- **Task Model** (`backend/src/models/task.model.js`): Defined a Mongoose schema for tasks linked to specific Stream channels and messages. Fields include `title`, `description`, `assignee`, `creator`, `channelId`, `messageId`, `dueDate`, and a status enum (`todo`, `in-progress`, `done`).
- **Task Backend API**:
  - Created `task.controller.js` with `createTask`, `getTasksByChannel`, and `updateTaskStatus` handlers.
  - Created `task.route.js` with protected REST endpoints (`POST /`, `GET /channel/:channelId`, `PATCH /:taskId`), all secured with `protectRoute` middleware.
  - Registered `/api/tasks` in `server.js`.
- **Frontend API Library** (`frontend/lib/api.js`): Added `createTask`, `getTasks`, and `updateTaskStatus` functions for communicating with the new backend endpoints.
- **`useTasks` Custom Hook**: Built a TanStack Query-powered hook to fetch and cache tasks per channel, and handle status-update mutations with automatic cache invalidation.
- **`TaskModal.jsx`**: A premium glassmorphic modal component that converts a chat message into a task. Features auto-filled description from message text, assignee dropdown from channel members, and an optional due date picker.
- **`TaskListDrawer.jsx`**: A slide-in panel that displays all tasks for the active channel, categorized into "To Do" and "Completed" sections. Each Task Card shows the assignee, due date, and a click-to-toggle status checkbox.

### Changed
- **`HomePage.jsx`**: Integrated `customMessageActions` prop on `MessageList` to inject a "Create Task" option into the Stream message dropdown menu. Moved `TaskModal` inside the `<Channel>` component tree to provide required Stream SDK context. Swapped default `ChannelHeader` for `CustomChannelHeader` to surface the Task List Drawer toggle.
- **`CustomChannelHeader.jsx`**: Added a `ListTodoIcon` button that toggles the `TaskListDrawer` open/closed, with an active highlight state when the drawer is open.

### Fixed
- **Stream SDK v13 Compatibility** (`customMessageActions`): The original `customMessageActions` prop on `<Channel>` was silently ignored in v13. Moved it to `<MessageList>` where it is correctly processed. Also removed a broken attempt to use the `experimental/MessageActions` bundle (`defaultMessageActionSet`) which caused a Vite `SyntaxError` and then an empty actions menu.
- **React Context Crash**: Resolved a blank-page crash caused by `TaskModal` using `useChannelStateContext()` while being rendered outside the `<Channel>` component. Fixed by moving the modal's render position to inside `<Channel>`.
- **Clerk Import Mismatch** (`CustomChannelHeader.jsx`): Corrected `@clerk/clerk-react` to `@clerk/react` to match the package installed in `package.json`, resolving a Vite import-analysis error.

## [2026-04-20] - Pinned Messages Sidebar and CORS Stabilization

### Added
- **Pinned Messages Sidebar** (`frontend/src/components/PinnedMessagesModal.jsx`):
  - Refactored the existing `PinnedMessagesModal` from a center-screen dialog into a premium, right-side slide-in sidebar (drawer).
  - Implemented a glassmorphic design system using `bg-purple-950/40` and `backdrop-blur-2xl` to match the "SLAP" aesthetic of the Task List Drawer.
  - Added a dynamic message counter badge and styled message cards that display sender avatars, names, and a 4-line text preview.
  - Integrated an interactive "Unpin" button on hover for each message card, allowing users to manage pins directly from the sidebar.
- **Pinning Message Actions**:
  - Expanded `customMessageActions` in `HomePage.jsx` to include "Pin Message" and "Unpin Message" options in the message settings menu (three-dot hover menu).
  - Wired these actions to the Stream Chat SDK's `pinMessage` and `unpinMessage` methods.

### Changed
- **`CustomChannelHeader.jsx`**:
  - Enhanced the pin button with toggle logic (clicking closes the sidebar if already open).
  - Added a purple active state highlight to the pin icon to provide clear visual feedback when the sidebar is active.
  - Integrated `useChatContext` to allow unpinning messages directly via the Stream client.
  - Implemented a `handleUnpin` function that updates the local sidebar state immediately after a successful API call for a snappier user experience.

### Fixed
- **CORS Connectivity**: Resolved a "preflight request blocked" error by updating `backend/src/server.js` to allow `http://localhost:5174` as a valid origin. This ensures the app remains stable when Vite shifts ports due to local environment conflicts.

## [2026-04-20] - Custom Profile Status Integration

### Added
- **User Model Update** (`backend/src/models/user.model.js`): Added a `status` field with a maximum length of 50 characters to store custom user statuses.
- **User Backend API**:
  - Created `user.controller.js` with `updateUserStatus` to handle secure status updates. Integrates `User.findOneAndUpdate` for MongoDB and `upsertStreamUser` to sync the status to the Stream Chat client.
  - Created `user.route.js` with a protected `PATCH /status` endpoint.
  - Registered `/api/users` route in `server.js`.
- **Frontend API Library** (`frontend/lib/api.js`): Added `updateUserStatus` method to facilitate PATCH requests to the backend endpoint.
- **Status Input UI** (`frontend/src/components/StatusInputPopover.jsx`):
  - Created a popover component that allows users to set a custom text and emoji status.
  - Includes a set of quick-select presets (e.g., "In a meeting", "Focus mode").
  - Optimistically updates `client.user.status` for the local Stream chat instance to ensure instantaneous UI feedback.
- **UI Integration**:
  - `HomePage.jsx`: Integrated the `StatusInputPopover` seamlessly into the dashboard sidebar header.
  - `UsersList.jsx`: Updated the direct messages sidebar logic to display a user's custom status immediately below their name.

## [2026-04-20] - Offline Email Notifications Implementation

### Added
- **Offline Email Notifications**:
  - **Webhook Route** (`backend/src/routes/webhook.route.js`): Established a secure endpoint to listen for Stream Chat `message.new` events. Uses header signature verification to ensure data integrity.
  - **Resend Integration** (`backend/src/utils/email.js`): Configured the Resend SDK to handle transactional email delivery. Designed a premium, responsive HTML template for unread message notifications.
  - **Inngest Workflow** (`backend/src/config/inngest.js`): Developed an event-driven function `handleOfflineNotification` that utilizes "smart debouncing" (2-minute sleep) to prevent spam. It verifies a recipient's offline status via the Stream SDK before fetching their email from MongoDB and triggering the notification.
- **Backend Configuration**:
  - Updated `env.js` and `.env` with `RESEND_API_KEY` mapping.
  - Registered `/api/webhooks` in `server.js`.

### Fixed
- **Production Dependency Resolution**: Moved `inngest` from `devDependencies` to `dependencies` in `backend/package.json` and synchronized `pnpm-lock.yaml` to ensure successful deployment and runtime execution on Vercel.
- **Startup Stability (Lazy Loading)**: Refactored `backend/src/utils/email.js` to implement lazy initialization for the Resend client. This prevents server-side crashes during startup when environment variables are being configured or missing.
- **Stream Client Export**: Updated `backend/src/config/stream.js` to export the `streamClient` instance, enabling its use for webhook verification in other routes.
- **Inngest Discovery**: Resolved an issue where new functions weren't triggering by forcing a synchronization in the Inngest Cloud Dashboard to refresh the application's function registry.

## [2026-04-21] - Channel Management and Task System Resilience

### Added
- **Leave Channel Functionality**:
  - **Premium UI**: Added a sleek, hover-to-reveal "Leave" button (LogOut icon) to the channel list items in `CustomChannelPreview.jsx`.
  - **Graceful State Handling**: Implemented logic to automatically clear the active chat view back to the "Empty State" if the user leaves the channel they are currently viewing.
  - **Confirmation Dialog**: Added a standard confirmation prompt to prevent accidental channel exits.
  - **Styling**: Updated `stream-chat-theme.css` with dedicated styles for the leave button, featuring subtle transitions and a red-tinted hover state.
- **Lazy User Sync**:
  - **On-the-Fly DB Sync**: Implemented a "Lazy Sync" mechanism in `task.controller.js`. When a task is assigned to a user missing from MongoDB, the system now automatically fetches their profile from Clerk and creates the database record on-demand.
  - **Identity resilience**: This ensures the Task system always works correctly even if users haven't triggered a standard login-sync recently.

### Fixed
- **Task Creation 404 Resolution**:
  - Resolved a deceptive 404 error that occurred when assigning tasks to users not yet in the database.
  - **API Clarity**: Updated the backend to return `400 Bad Request` instead of `404` for validation failures, distinguishing between missing endpoints and missing data.
  - **Improved Feedback**: Enhanced `TaskModal.jsx` to extract and display detailed backend error messages in frontend toasts, providing better guidance to users.

### Task List
- [x] Implement MongoDB connection logic using Mongoose.
- [x] Replace Vite boilerplate with authentication components.
- [x] Define User model and implement basic CRUD logic for Clerk syncing.
- [x] Integrate Inngest with Express server for webhook processing.
- [x] Verify MongoDB Atlas connection and server startup.
- [x] Set up basic API routes and controllers in the backend.
- [x] Add `cors()` middleware to the backend.
- [x] Set up frontend infrastructure (Router, Sentry, Query Client, Toast).
- [x] Integrate Stream Chat React SDK on the frontend.
- [x] Implement core dashboard components (Channel list, Message window).
- [x] Implement form validation on both client and server sides.
- [x] Implement AuthProvider logic and secure token handling.
- [x] Design and implement the primary dashboard layout with custom "SLAP" aesthetic.
- [ ] Build a comprehensive profile management page.
- [x] Define Task model for message-to-task integration.
- [x] Implement Backend API routes and controllers for Task management.
- [x] Build the TaskModal UI components.
- [x] Connect the "Create Task" button to the Stream Chat message list.
- [x] Build the Channel Task List drawer in the dashboard.
- [x] Build the Shared File Explorer sidebar with filtering and pagination.
- [x] Implement offline email notifications using Stream Webhooks, Inngest, and Resend.
- [x] Implement "Leave Channel" functionality for public and private channels.
- [x] Implement "Lazy User Sync" for robust task assignment.

