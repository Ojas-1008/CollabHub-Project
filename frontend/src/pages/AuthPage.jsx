import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";

const AuthPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {isSignIn ? <SignIn /> : <SignUp />}
      <button 
        onClick={() => setIsSignIn(!isSignIn)} 
        className="mt-4 text-blue-500 underline"
      >
        {isSignIn ? "Need an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </div>
  );
};

export default AuthPage;
