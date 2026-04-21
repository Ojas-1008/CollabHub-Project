import React, { useState, useEffect, useRef } from "react";
import { SmileIcon, XIcon, CheckIcon } from "lucide-react";
import { updateUserStatus } from "../../lib/api";
import { useChatContext } from "stream-chat-react";
import toast from "react-hot-toast";

const PRESET_STATUSES = [
    { emoji: "🗓️", text: "In a meeting" },
    { emoji: "🎧", text: "Focus mode" },
    { emoji: "🌴", text: "Out of office" },
    { emoji: "🏠", text: "Working remotely" },
    { emoji: "☕", text: "Taking a break" },
    { emoji: "🚀", text: "Shipping code" }
];

export default function StatusInputPopover() {
    const { client } = useChatContext();
    const [isOpen, setIsOpen] = useState(false);
    const [statusText, setStatusText] = useState(client?.user?.status || "");
    const [isSaving, setIsSaving] = useState(false);
    const popoverRef = useRef(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Don't show if chat client isn't fully loaded
    if (!client?.user) return null;

    const currentStatus = client.user.status;

    // Helper to extract emoji if present at the start of string
    const getStatusParts = (statusStr) => {
        if (!statusStr) return { emoji: null, text: "" };
        const match = statusStr.match(/^(\p{Extended_Pictographic}|\u200d)+/u);
        if (match) {
            return { emoji: match[0], text: statusStr.replace(match[0], "").trim() };
        }
        return { emoji: null, text: statusStr };
    };

    const { emoji: activeEmoji, text: activeText } = getStatusParts(currentStatus);

    const handleSave = async (newStatusText) => {
        setIsSaving(true);
        try {
            await updateUserStatus(newStatusText);
            client.user.status = newStatusText;
            setStatusText(newStatusText);
            setIsOpen(false);
            toast.success(newStatusText ? "Status updated!" : "Status cleared!");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update status");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation(); // prevent opening the popover if we click the clear icon on the badge
        handleSave("");
    }

    return (
        <div className="relative mt-2" ref={popoverRef}>
             {/* 1. THE FROSTED GLASS BADGE (TRIGGER BUTTON) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 text-left relative overflow-hidden ${
                    currentStatus 
                        ? 'bg-white/10 backdrop-blur-md border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:bg-white/20 hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:-translate-y-0.5' 
                        : 'hover:bg-white/10 border border-transparent'
                }`}
            >
                {/* Glow effect behind the badge when active */}
                {currentStatus && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent blur-md -z-10" />
                )}

                <div className={`flex items-center justify-center rounded-lg transition-transform ${currentStatus ? 'bg-white/10 p-1.5 scale-110 shadow-inner' : 'p-1 bg-white/5'}`}>
                    {activeEmoji ? (
                         <span className="text-sm drop-shadow-md leading-none">{activeEmoji}</span>
                    ) : (
                        <SmileIcon className="size-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex items-center justify-between gap-2">
                    <p className={`text-[13px] font-semibold truncate ${currentStatus ? 'text-white drop-shadow-sm' : 'text-purple-200/60 font-medium'}`}>
                        {activeText || (currentStatus ? "..." : "Set a status...")}
                    </p>
                    
                    {/* The Pulse Indicator & Hover Clear Action */}
                    {currentStatus && (
                        <div className="flex items-center">
                             {/* Pulse dot shows by default, replaced by 'Clear' X on hover */}
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] group-hover:hidden animate-pulse"></div>
                            
                            <div 
                                onClick={handleClear}
                                className="hidden group-hover:flex items-center justify-center p-1 rounded-full hover:bg-white/20 text-purple-200 hover:text-white transition-colors cursor-pointer"
                            >
                                <XIcon className="size-3" />
                            </div>
                        </div>
                    )}
                </div>
            </button>

            {/* 2. THE QUICK PRESETS POPOVER */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-purple-950/80 backdrop-blur-3xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-purple-500/30 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-3.5 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-transparent">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-purple-300/80 uppercase tracking-widest pl-1">Status Config</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-purple-400 hover:text-white transition-colors">
                            <XIcon className="size-4" />
                        </button>
                    </div>

                    {/* Custom Input Area */}
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={statusText}
                                onChange={(e) => setStatusText(e.target.value)}
                                placeholder="What's your status?"
                                className="w-full text-sm bg-black/20 border border-purple-500/20 rounded-xl pl-3 pr-10 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all shadow-inner"
                                maxLength={50}
                            />
                            {statusText && (
                                <button 
                                    onClick={() => setStatusText("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSave(statusText)}
                                disabled={isSaving || statusText === currentStatus}
                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : <><CheckIcon className="size-3.5" /> Save Status</>}
                            </button>
                            {currentStatus && (
                                <button 
                                    onClick={() => handleSave("")}
                                    disabled={isSaving}
                                    className="px-4 bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-colors border border-red-500/20"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Gradient Selection Cards Grid */}
                    <div className="p-4 border-t border-purple-500/20 bg-black/20">
                        <p className="text-[10px] uppercase font-bold text-purple-400/70 mb-3 px-1 tracking-widest">Quick Presets</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {PRESET_STATUSES.map((preset, index) => {
                                const fullText = `${preset.emoji} ${preset.text}`;
                                const isSelected = currentStatus === fullText;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setStatusText(fullText);
                                            handleSave(fullText);
                                        }}
                                        className={`p-3 rounded-xl text-left transition-all duration-200 border relative overflow-hidden group ${
                                            isSelected 
                                                ? 'bg-purple-500/20 border-purple-400/50 shadow-inner' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-lg'
                                        }`}
                                    >
                                        {/* Hover glow effect for cards */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/0 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="flex flex-col gap-2 relative z-10">
                                            <span className="text-xl drop-shadow-md transform group-hover:scale-110 transition-transform origin-left">{preset.emoji}</span>
                                            <span className={`text-[11px] font-bold tracking-wide truncate ${isSelected ? 'text-white' : 'text-purple-200/60 group-hover:text-purple-100'}`}>
                                                {preset.text}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

