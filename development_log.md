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




### Pending Tasks
- [x] Implement MongoDB connection logic using Mongoose.
- [x] Replace Vite boilerplate with authentication components.
- [x] Define User model and implement basic CRUD logic for Clerk syncing.
- [x] Integrate Inngest with Express server for webhook processing.
- [x] Verify MongoDB Atlas connection and server startup.
- [x] Set up basic API routes and controllers in the backend.
- [x] Add `cors()` middleware to the backend.
- [x] Set up frontend infrastructure (Router, Sentry, Query Client, Toast).
- [x] Integrate Stream Chat React SDK on the frontend.
- [ ] Implement core dashboard components (Channel list, Message window).
- [ ] Implement form validation on both client and server sides.
- [x] Implement AuthProvider logic and secure token handling.
- [ ] Build a comprehensive profile management page.
- [ ] Design and implement the primary dashboard layout.




