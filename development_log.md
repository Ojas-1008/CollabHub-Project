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

### Pending Tasks
- [ ] Implement MongoDB connection logic using Mongoose.
- [ ] Add `express.json()` and `cors()` middleware to the backend.
- [ ] Set up basic API routes and controllers in the backend.
- [ ] Replace Vite boilerplate with custom frontend components and form validation logic.
- [ ] Implement form validation on both client and server sides.
