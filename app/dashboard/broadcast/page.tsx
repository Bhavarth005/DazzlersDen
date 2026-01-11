"use client"

import { useState } from "react";
import { 
    Send, 
    MessageSquare, 
    Users, 
    History, 
    Sparkles, 
    Smartphone, 
    CheckCircle2, 
    AlertTriangle, 
    Loader2,
    X,
    Mail
} from "lucide-react";

// --- Types ---
type BroadcastLog = {
    id: number;
    message: string;
    recipients: number;
    channel: "WHATSAPP" | "SMS";
    status: "SENT" | "FAILED" | "SCHEDULED";
    sentAt: string;
};

export default function BroadcastPage() {
    // --- State ---
    const [message, setMessage] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
    const [isSending, setIsSending] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Mock History Data
    const [history, setHistory] = useState<BroadcastLog[]>([
        { id: 1, message: "Weekend Offer: Get 50% extra bonus on recharge above ₹1000!", recipients: 150, channel: "WHATSAPP", status: "SENT", sentAt: "2024-01-10 10:00 AM" },
        { id: 2, message: "System maintenance scheduled for tonight.", recipients: 142, channel: "SMS", status: "SENT", sentAt: "2024-01-05 06:30 PM" },
    ]);

    // Helper to insert variables
    const insertVariable = (variable: string) => {
        setMessage(prev => prev + ` {{${variable}}} `);
    };

    const handleSendBroadcast = async () => {
        setIsSending(true);

        try {
            const token = localStorage.getItem("access_token"); 

            if (!token) {
                alert("You are not logged in! Please login again.");
                window.location.href = "/login"; // Redirect if needed
                return;
            }
            const response = await fetch('/api/broadcast', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to send broadcast");
            }

            const newLog: BroadcastLog = {
                id: Math.random(),
                message: message,
                recipients: data.sent,
                channel: selectedChannel,
                status: data.failed > 0 ? "FAILED" : "SENT",
                sentAt: new Date().toLocaleString()
            };

            setHistory([newLog, ...history]);
            setMessage("");
            setIsConfirmModalOpen(false);
            
            alert(`Broadcast Report:\nSuccess: ${data.sent}\nFailed: ${data.failed}`);

        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up p-4">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Broadcast Messaging</h1>
                    <p className="text-slate-500 dark:text-slate-400">Send announcements to all registered customers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COL: Composer */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6">
                        {/* Message Input */}
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                <span>Message Content</span>
                                <span className="text-slate-400 font-normal text-xs">{message.length} chars</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-40 p-4 rounded-xl border border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-medium"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                disabled={!message.trim()}
                                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send size={18} />
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 sticky top-6">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <Smartphone size={16} />
                            Preview
                        </h3>
                        
                        {/* Phone Frame */}
                        <div className="bg-slate-900 rounded-4xl p-3 shadow-2xl border-4 border-slate-800">
                            <div className="bg-slate-100 dark:bg-gray-950 rounded-3xl h-100 overflow-hidden flex flex-col relative">
                                {/* Fake Header */}
                                <div className="bg-emerald-600 p-3 flex items-center gap-3 text-white shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Users size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold">My Business</p>
                                        <p className="opacity-80">Online</p>
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 p-4 bg-[#e5ddd5] dark:bg-slate-900/50 flex flex-col gap-3 overflow-y-auto bg-opacity-10" 
                                     style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}>

                                    {message && (
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] self-start text-xs text-slate-800 dark:text-slate-200 animate-in zoom-in-95 duration-200 wrap-break-word whitespace-pre-wrap">
                                            {/* Render variables highlighted */}
                                            <p dangerouslySetInnerHTML={{
                                                __html: message.replace(/{{\s*(\w+)\s*}}/g, '<span class="text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">{{$1}}</span>')
                                            }} />
                                            <span className="text-[10px] text-slate-400 mt-1 block text-right">Just now</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600">
                                <AlertTriangle size={32} />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Broadcast</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    You are about to send this message to <strong className="text-slate-900 dark:text-white">All Active Customers</strong> via <strong>{selectedChannel}</strong>.
                                </p>
                            </div>

                            <div className="w-full bg-slate-50 dark:bg-gray-900 p-4 rounded-xl text-left border border-slate-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Message Preview</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{message}"</p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendBroadcast}
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        <span>Confirm Send</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}