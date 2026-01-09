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

// Type definitions based on MQTT Protocol Guide v2.1
interface ActivityItem {
    id: number;
    activity_type: string;
    timestamp: string;
    activity_data: any;
}

interface MemoryStats {
    total: number;
    by_type: Record<string, number>;
    last_24h: number;
    last_7d: number;
}

const Memory: React.FC = () => {
    const { publish, messages } = useMqtt();
    const [activeTab, setActiveTab] = useState<'live' | 'activity' | 'base' | 'recent'>('live');

    // Data States
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Initial Load - Fetch Stats
    useEffect(() => {
        // Request stats on mount
        publish('memory/stats/request', 'get_stats');
    }, [publish]);

    // Parse MQTT Messages
    useEffect(() => {
        // 1. Timeline Feed
        if (messages['history/1']) {
            try {
                const data = JSON.parse(messages['history/1']);
                if (data.type === 'timeline_feed' && data.data) {
                    setTimeline(data.data);
                    setLoadingTimeline(false);
                }
            } catch (e) {
                console.error('Failed to parse timeline:', e);
                setLoadingTimeline(false);
            }
        }

        // 2. Activity Search Response
        if (messages['memory/activity/response']) {
            try {
                const data = JSON.parse(messages['memory/activity/response']);
                if (data.results) {
                    setActivityLog(data.results);
                    setLoadingActivity(false);
                }
            } catch (e) {
                console.error('Failed to parse activity response:', e);
                setLoadingActivity(false);
            }
        }

        // 3. Stats Response
        if (messages['memory/stats/response']) {
            try {
                const data = JSON.parse(messages['memory/stats/response']);
                setStats(data);
            } catch (e) {
                console.error('Failed to parse stats:', e);
            }
        }
    }, [messages]);

    // Request Data on Tab Change
    useEffect(() => {
        if (activeTab === 'live') {
            setLoadingTimeline(true);
            publish('history/2', 'check_history');
        } else if (activeTab === 'activity') {
            setLoadingActivity(true);
            // Initial empty search to get recent
            publish('memory/activity/search', JSON.stringify({
                query: "",
                activity_type: null,
                days_back: 30,
                limit: 10
            }));
            publish('memory/stats/request', 'get_stats');
        }
    }, [activeTab, publish]);

    const handleActivitySearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingActivity(true);
        publish('memory/activity/search', JSON.stringify({
            query: searchQuery,
            activity_type: null,
            days_back: 30,
            limit: 20
        }));
    };

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
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl overflow-x-auto">
                    {['live', 'activity', 'base', 'recent'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab === 'live' ? 'Live History' : tab === 'activity' ? 'Activity Log' : tab === 'base' ? 'Base Memory' : 'Recent Context'}
                        </button>
                    ))}
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
                                        setLoadingTimeline(true);
                                        publish('history/2', 'check_history');
                                    }}
                                    className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>

                            {loadingTimeline ? (
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
                                    {timeline.map((item, i) => (
                                        <div key={item.id || i} className="relative group">
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

                    {/* --- ACTIVITY LOG --- */}
                    {activeTab === 'activity' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Stats Overview */}
                            {stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Activities</div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Last 24h</div>
                                        <div className="text-2xl font-black text-teal-500">{stats.last_24h}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Notes Taken</div>
                                        <div className="text-2xl font-black text-purple-500">{stats.by_type?.note_taken || 0}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Auth Events</div>
                                        <div className="text-2xl font-black text-amber-500">{stats.by_type?.auth_event || 0}</div>
                                    </div>
                                </div>
                            )}

                            {/* Search */}
                            <form onSubmit={handleActivitySearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <button type="submit" className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                                    Search
                                </button>
                            </form>

                            {/* Results */}
                            {loadingActivity ? (
                                <div className="text-center py-20 text-slate-500">Loading activities...</div>
                            ) : activityLog.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">No activities found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {activityLog.map((log) => (
                                        <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                            <div className="flex gap-4 items-center">
                                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${log.activity_type === 'note_taken' ? 'bg-purple-100 text-purple-600' :
                                                    log.activity_type === 'auth_event' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    <span className="material-symbols-outlined">
                                                        {log.activity_type === 'note_taken' ? 'edit_note' :
                                                            log.activity_type === 'auth_event' ? 'vpn_key' : 'list'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-white capitalize">{log.activity_type.replace('_', ' ')}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-black/30 px-3 py-2 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 w-full md:w-auto max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                                                {JSON.stringify(log.activity_data)}
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
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Memory;