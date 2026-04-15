import { useParams } from "react-router-dom";

const CallPage = () => {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Meeting: {id}</h1>
      <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Video implementation coming soon...</p>
      </div>
    </div>
  );
};

export default CallPage;
