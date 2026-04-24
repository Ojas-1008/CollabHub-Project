import { useAuth } from "@clerk/react";
import { Navigate, Route, Routes } from "react-router-dom";

// 1. IMPORT PAGES
// These are the different screens of your application.
import AuthPage from "./pages/AuthPage";
import CallPage from "./pages/CallPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";

// 2b. PROFILE STYLES
import "./styles/profile.css";

// 2. ERROR TRACKING
// Sentry helps you find and fix bugs by tracking errors in your app.
import * as Sentry from "@sentry/react";

/**
 * We wrap the standard "Routes" with Sentry logic. 
 * This allows Sentry to see which pages your users are visiting.
 */
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

const App = () => {
  // 3. AUTHENTICATION STATE
  // Clerk tells us if the user is signed in and if it's done loading the user data.
  const { isSignedIn, isLoaded } = useAuth();

  // If Clerk is still checking the session, show a simple loading message.
  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-gray-500 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <SentryRoutes>
      {/* HOME PAGE: 
          If signed in -> show HomePage. 
          If not -> send them to the /auth page. */}
      <Route 
        path="/" 
        element={isSignedIn ? <HomePage /> : <Navigate to="/auth" replace />} 
      />

      {/* PROFILE PAGE:
          Only signed-in users can view their profile. */}
      <Route
        path="/profile"
        element={isSignedIn ? <ProfilePage /> : <Navigate to="/auth" replace />}
      />

      {/* AUTH PAGE: 
          If already signed in -> send them to home /. 
          If not -> show the AuthPage (Login/Signup). */}
      <Route 
        path="/auth" 
        element={!isSignedIn ? <AuthPage /> : <Navigate to="/" replace />} 
      />

      {/* VIDEO CALL PAGE: 
          Only signed-in users can join a call. */}
      <Route
        path="/call/:id"
        element={isSignedIn ? <CallPage /> : <Navigate to="/auth" replace />}
      />

      {/* FALLBACK (Global Catch-All): 
          If the user types a random URL, send them to the appropriate place based on status. */}
      <Route
        path="*"
        element={isSignedIn ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />}
      />
    </SentryRoutes>
  );
};

export default App;