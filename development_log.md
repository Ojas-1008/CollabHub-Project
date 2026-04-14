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

### Pending Tasks
- [x] Implement MongoDB connection logic using Mongoose.
- [x] Replace Vite boilerplate with authentication components.
- [x] Define User model and implement basic CRUD logic for Clerk syncing.
- [x] Integrate Inngest with Express server for webhook processing.
- [x] Verify MongoDB Atlas connection and server startup.
- [ ] Add `cors()` middleware to the backend.
- [ ] Set up basic API routes and controllers in the backend.
- [ ] Implement form validation on both client and server sides.
- [ ] Design and implement the primary dashboard layout.

