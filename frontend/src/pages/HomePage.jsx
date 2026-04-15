import { UserButton } from "@clerk/react";

const HomePage = () => {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CollabHub Dashboard</h1>
        <UserButton />
      </header>
      <main>
        <p className="text-gray-600">Welcome to your collaborative workspace!</p>
      </main>
    </div>
  );
};

export default HomePage;
