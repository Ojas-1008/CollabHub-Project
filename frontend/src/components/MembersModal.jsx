/*
 * MembersModal.jsx
 * ----------------
 * A read-only popup that lists every member currently in the active channel.
 * Features a Liquid Glass design with live search and presence indicators.
 */

import { useState } from "react";
import { XIcon, SearchIcon } from "lucide-react";

function MembersModal({ members, onClose }) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter members based on the search query
    const filteredMembers = members.filter((member) => {
        const name = (member.user.name || member.user.id).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[4px] animate-in fade-in duration-300">
            {/* Liquid Glass Modal Card */}
            <div 
                className="bg-white/80 backdrop-blur-[24px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-lg mx-4 border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300"
                style={{ 
                    boxShadow: "0 20px 50px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.8)" 
                }}
            >
                {/* HEADER: Title + close button */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Channel Members</h2>
                        <p className="text-sm font-medium text-purple-600/70">{members.length} people in this team</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-xl bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all"
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>

                {/* SEARCH BAR (Liquid Glass style) */}
                <div className="px-8 mb-4">
                    <div className="relative group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search members..."
                            className="w-full bg-white/40 border border-purple-200/50 rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-400/50 transition-all text-sm font-medium placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* MEMBERS LIST */}
                <div className="px-8 pb-8 max-h-[400px] overflow-y-auto ch-scrollbar">
                    {filteredMembers.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {filteredMembers.map((member) => {
                                const { user } = member;
                                const initialLetter = (user.name || user.id).charAt(0).toUpperCase();
                                
                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-white/60 hover:bg-white/40 hover:shadow-sm transition-all group"
                                    >
                                        {/* AVATAR with Presence Indicator */}
                                        <div className="relative">
                                            {user.image ? (
                                                <img
                                                    src={user.image}
                                                    alt={user.name}
                                                    className="size-11 rounded-xl object-cover border border-white/80 shadow-sm"
                                                />
                                            ) : (
                                                <div className="size-11 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center border border-white/80 shadow-sm">
                                                    <span className="text-white font-bold text-lg">{initialLetter}</span>
                                                </div>
                                            )}
                                            
                                            {/* Presence indicator (Online/Offline) */}
                                            <div className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white shadow-sm ${user.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                                {user.name || user.id}
                                            </span>
                                            <span className="text-[12px] font-medium text-gray-500/70">
                                                {user.online ? "Active now" : "Offline"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm font-medium text-gray-500">No members found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MembersModal;