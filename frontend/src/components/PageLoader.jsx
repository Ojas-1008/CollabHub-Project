import { Loader2Icon } from "lucide-react";

/**
 * PageLoader Component
 * A full-screen loading spinner used while the application is loading user or chat data.
 */
const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Loader2Icon className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );
};

export default PageLoader;