import React, { useState } from "react";
import { SmileIcon, XIcon, CheckIcon } from "lucide-react";
import { updateUserStatus } from "../../lib/api";
import { useChatContext } from "stream-chat-react";
import toast from "react-hot-toast";

const PRESET_STATUSES = [
    { emoji: "🗓️", text: "In a meeting" },
    { emoji: "🎧", text: "Focus mode" },
    { emoji: "🌴", text: "Out of office" },
    { emoji: "🏠", text: "Working remotely" },
    { emoji: "☕", text: "Taking a break" }
];

export default function StatusInputPopover() {
    const { client } = useChatContext();
    const [isOpen, setIsOpen] = useState(false);
    const [statusText, setStatusText] = useState(client?.user?.status || "");
    const [isSaving, setIsSaving] = useState(false);

    // Don't show if chat client isn't fully loaded
    if (!client?.user) return null;

    const handleSave = async (newStatusText) => {
        setIsSaving(true);
        try {
            // Update backend and Stream
            await updateUserStatus(newStatusText);
            
            // Optimistically update our local stream client state
            // so we don't have to wait for a refresh
            client.user.status = newStatusText;
            
            setStatusText(newStatusText);
            setIsOpen(false);
            toast.success("Status updated!");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update status");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative mt-2">
            {/* TRIGGER BUTTON */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-left"
            >
                <div className="p-1 bg-white/10 rounded">
                    <SmileIcon className="size-4 text-purple-300" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-medium text-white/90 truncate">
                        {client.user.status || "Set a status..."}
                    </p>
                </div>
            </button>

            {/* POPOVER */}
            {isOpen && (
                <>
                    {/* Backdrop to close when clicking outside */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />
                    
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Set Status</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XIcon className="size-4" />
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={statusText}
                                    onChange={(e) => setStatusText(e.target.value)}
                                    placeholder="What's your status?"
                                    className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    maxLength={50}
                                />
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => handleSave(statusText)}
                                    disabled={isSaving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                                >
                                    {isSaving ? "Saving..." : <><CheckIcon className="size-3" /> Save</>}
                                </button>
                                {client.user.status && (
                                    <button 
                                        onClick={() => handleSave("")}
                                        disabled={isSaving}
                                        className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-md transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="border-t border-gray-100 bg-gray-50/50 p-2">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">Suggestions</p>
                            <div className="space-y-1">
                                {PRESET_STATUSES.map((preset, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setStatusText(`${preset.emoji} ${preset.text}`);
                                            handleSave(`${preset.emoji} ${preset.text}`);
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-md text-left transition-colors text-sm text-gray-700"
                                    >
                                        <span>{preset.emoji}</span>
                                        <span>{preset.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
