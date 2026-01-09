import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';

// Note: Base Memory and Recent Context are not in the protocol guide
// Keeping dummy data for these tabs until backend implements them
const BASE_MEMORY = [
    { category: 'Identity', facts: ['Name is Davin', 'Software Engineer', 'Lives in Jakarta'] },
    { category: 'Preferences', facts: ['Likes dark mode', 'Prefers concise answers', 'Morning person'] },
    { category: 'Health', facts: ['Allergic to peanuts', 'Goal: Drink 2L water daily'] },
];

const RECENT_MEMORY_RAW = `[CONTEXT_WINDOW_START]
User is working on a React application named 'Alex'.
Current focus: refining UI for 'Notes' and 'Memory' pages.
User prefers 'premium' aesthetics: pink/purple gradients, rounded corners, glassmorphism.
Last action: Updated RobotModel.tsx with pixel eyes.
[CONTEXT_WINDOW_END]`;

const Memory: React.FC = () => {
    const { publish, messages } = useMqtt();
    const [activeTab, setActiveTab] = useState<'live' | 'base' | 'recent'>('live');
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Parse MQTT Messages
    useEffect(() => {
        if (messages['history/1']) {
            try {
                const data = JSON.parse(messages['history/1']);
                if (data.type === 'timeline_feed' && data.data) {
                    setTimeline(data.data);
                    setLoading(false);
                }
            } catch (e) {
                console.error('Failed to parse timeline:', e);
                setLoading(false);
            }
        }
    }, [messages]);

    // Request timeline when Live History tab is selected
    useEffect(() => {
        if (activeTab === 'live') {
            setLoading(true);
            publish('history/2', 'check_history');
            // Note: Protocol guide warns of 3-5 second LLM processing delay
        }
    }, [activeTab, publish]);

    return (
        <div className="bg-gradient-to-br from-pink-50 to-white dark:from-[#1a0f14] dark:to-[#15232b] font-display text-slate-800 dark:text-slate-100 h-full flex flex-col overflow-hidden w-full">

            {/* Header */}
            <header className="h-16 border-b border-pink-100 dark:border-slate-800 bg-white/60 dark:bg-[#15232b]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors" to="/dashboard">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        <span className="text-sm font-bold">Back</span>
                    </Link>
                    <span className="h-4 w-px bg-slate-200 dark:bg-slate-700"></span>
                    <h1 className="text-lg font-bold text-pink-950 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-500">psychology</span> Memory Core
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Live History
                    </button>
                    <button
                        onClick={() => setActiveTab('base')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'base' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Base Memory
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'recent' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Recent Context
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto">

                    {/* --- LIVE HISTORY (TIMELINE) --- */}
                    {activeTab === 'live' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Live History</h2>
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        publish('history/2', 'check_history');
                                    }}
                                    className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm text-slate-500">Loading timeline (3-5s LLM processing)...</p>
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">history</span>
                                    <p>No timeline data available. Start a conversation with Alex.</p>
                                </div>
                            ) : (
                                <div className="relative pl-8 border-l-2 border-pink-100 dark:border-slate-700 space-y-12">
                                    {/* Timeline Items */}
                                    {timeline.map((item, i) => (
                                        <div key={item.id} className="relative group">
                                            {/* Dot */}
                                            <div className={`absolute -left-[41px] top-1 size-5 rounded-full border-4 border-white dark:border-[#1a0f14] ${item.type === 'conversation' ? 'bg-purple-500' : 'bg-teal-500'} group-hover:scale-125 transition-transform shadow-sm`}></div>

                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.date} • {item.time}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.theme === 'Work' ? 'bg-blue-100 text-blue-700' :
                                                        item.theme === 'Personal' ? 'bg-pink-100 text-pink-700' :
                                                            item.theme === 'Health' ? 'bg-green-100 text-green-700' :
                                                                item.theme === 'Code' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }`}>{item.theme}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors cursor-pointer">{item.title}</h3>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-pink-50 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer">
                                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.summary}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- BASE MEMORY (LIST) --- */}
                    {activeTab === 'base' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Base Memory</h2>
                                <p className="text-slate-500">Core facts and preferences stored long-term.</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">⚠️ Not implemented in backend protocol. Using dummy data.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {BASE_MEMORY.map((section, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-teal-200 dark:hover:border-teal-900/50 transition-colors">
                                        <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 mb-4">{section.category}</h3>
                                        <ul className="space-y-3">
                                            {section.facts.map((fact, j) => (
                                                <li key={j} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                                    <span className="material-symbols-outlined text-teal-300 text-sm pt-1">verified</span>
                                                    <span>{fact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                {/* Add New Memory Card */}
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-center text-slate-400 hover:text-teal-500 hover:border-teal-200 hover:bg-teal-50/50 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
                                        <span className="font-bold text-sm">Add Core Memory</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RECENT MEMORY (TEXTBOX) --- */}
                    {activeTab === 'recent' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Recent Context</h2>
                                <p className="text-slate-500">The raw context window currently active in the agent.</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">⚠️ Not implemented in backend protocol. Using dummy data.</p>
                            </div>

                            <div className="relative group">
                                <textarea
                                    readOnly
                                    className="w-full h-[500px] bg-slate-50 dark:bg-[#1a0f14] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 font-mono text-xs md:text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none custom-scrollbar leading-relaxed"
                                    value={RECENT_MEMORY_RAW}
                                />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-500 hover:text-primary">
                                        Copy Raw
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Memory;