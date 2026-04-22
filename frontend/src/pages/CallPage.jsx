import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import toast from "react-hot-toast";
import { PhoneOff, Loader2 } from "lucide-react";

import { getStreamToken } from "../../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const { user, isLoaded } = useUser();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!user,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !user || !callId) return;

      if (!STREAM_API_KEY) {
        console.error("STREAM_API_KEY is missing. Please check your .env file.");
        toast.error("Video configuration error.");
        setIsConnecting(false);
        return;
      }

      try {
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: user.id,
            name: user.fullName,
            image: user.imageUrl,
          },
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.log("Error init call:", error);
        toast.error("Cannot connect to the call.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, user, callId]);

  if (isConnecting || !isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-[#0f0524] bg-gradient-to-br from-[#1a0b3b] via-[#2d094b] to-[#0f0524] overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="flex flex-col items-center gap-8 z-10">
           <div className="relative">
             <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-60 animate-pulse"></div>
             <img src="/logo.png" alt="CollabHub Logo" className="w-28 h-28 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] relative z-10" />
           </div>
           <div className="flex items-center gap-4 text-white font-semibold text-xl tracking-wide bg-white/5 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
             <Loader2 className="size-6 animate-spin text-purple-400" />
             <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
               Establishing Secure Connection...
             </span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f0524] bg-gradient-to-br from-[#1a0b3b] via-[#2d094b] to-[#0f0524] overflow-hidden text-white font-sans">
      {/* Header */}
      <header className="h-[76px] flex items-center justify-between px-6 bg-black/30 backdrop-blur-2xl border-b border-white/5 shrink-0 relative z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 drop-shadow-md" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent leading-none mb-1">
              CollabHub
            </span>
            <span className="text-[11px] font-bold text-purple-400/80 tracking-[0.2em] uppercase leading-none">
              Secure Video Session
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            End-to-End Encrypted
          </div>
        </div>
      </header>

      {/* Main Call Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-purple-600/15 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45rem] h-[45rem] bg-indigo-600/15 rounded-full mix-blend-screen filter blur-[130px] pointer-events-none"></div>

        <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="flex-1 w-full max-w-[1600px] mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative ring-1 ring-white/5">
            {client && call ? (
              <StreamVideo client={client}>
                <StreamCall call={call}>
                  <CallContent />
                </StreamCall>
              </StreamVideo>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-8 relative z-10">
                <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md mb-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <PhoneOff className="size-16 text-red-400 drop-shadow-lg" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Call Unavailable</h2>
                <p className="text-purple-200/70 max-w-md text-lg leading-relaxed">
                  We couldn't establish the secure video connection. Please check your network and try again.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] active:scale-95 border border-white/10"
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) {
    setTimeout(() => navigate("/"), 100);
    return null;
  }

  return (
    <StreamTheme className="h-full flex flex-col w-full bg-transparent">
      <div className="flex-1 w-full rounded-t-[2rem] overflow-hidden relative">
        <SpeakerLayout />
      </div>
      <div className="w-full bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-center py-5 rounded-b-[2rem] z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <CallControls onLeave={() => navigate("/")} />
      </div>
    </StreamTheme>
  );
};

export default CallPage;