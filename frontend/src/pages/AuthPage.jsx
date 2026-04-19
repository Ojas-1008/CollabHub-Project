import "../styles/auth.css";
import { SignInButton } from "@clerk/react";
import { useState, useEffect } from "react";

const AuthPage = () => {
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);

  // Use effect to clear the initial page loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-hero">
          <div className="brand-container">
            <img src="/logo.png" alt="collabhub" className="brand-logo" />
            <span className="brand-name">collabhub</span>
          </div>

          <h1 className="hero-title">Where Work Happens ✨</h1>

          <p className="hero-subtitle">
            Connect with your team instantly through secure, real-time messaging. Experience
            seamless collaboration with powerful features designed for modern teams.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Real-time messaging</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🎥</span>
              <span>Video calls & meetings</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure & private</span>
            </div>
          </div>

          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="cta-button" disabled={isLoading}>
              <span className="button-content">
                Get Started with collabhub
                <span className="button-arrow">→</span>
              </span>
            </button>
          </SignInButton>

          <footer className="auth-footer">
            <p>© 2026 collabhub. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>
          </footer>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-image-container">
          <img src="/auth-i.png" alt="Team collaboration" className="auth-image" />
          <div className="image-overlay"></div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;