import { UserButton } from "@clerk/react";
import { useChat } from "../providers/AuthProvider";

const HomePage = () => {
  const { chatClient } = useChat();

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">CollabHub Dashboard</h1>
          {chatClient ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              ● Connected to Chat
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">
              Connecting to Chat...
            </span>
          )}
        </div>
        <UserButton />
      </header>
      <main>
        <p className="text-gray-600">Welcome to your collaborative workspace!</p>
      </main>
    </div>
  );
};

export default HomePage;
