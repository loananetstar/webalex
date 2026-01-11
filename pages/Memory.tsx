import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';

// v2.0: Base Memory and Recent Context now have real backend endpoints!

// Type definitions based on Protocol v2.0
interface ActivityItem {
    id: number;
    activity_type: string;
    timestamp: string;
    activity_data: any;
}

interface MemoryStats {
    total: number;
    by_activity_type?: Record<string, number>;
    by_type?: Record<string, number>;
    memories?: { total: number; by_type: Record<string, number> };
}

// v2.0 Base Memory Structure
interface BaseMemoryItem {
    text: string;
    confidence: number;
}

interface BaseMemoryData {
    identities: BaseMemoryItem[];
    deep_facts: BaseMemoryItem[];
    preferences: BaseMemoryItem[];
}

// v2.0 Context Structure
interface ContextItem {
    text: string;
    timestamp: string;
    session_id: string;
}

interface ContextData {
    recent_contexts: ContextItem[];
    conversation_buffer: string[];
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

    // v2.0: Base Memory State
    const [baseMemory, setBaseMemory] = useState<BaseMemoryData | null>(null);
    const [loadingBase, setLoadingBase] = useState(false);

    // v2.0: Context State
    const [contextData, setContextData] = useState<ContextData | null>(null);
    const [loadingContext, setLoadingContext] = useState(false);

    // Initial Load - Fetch Stats
    useEffect(() => {
        publish('memory/stats/request', 'GET');
    }, [publish]);

    // Parse MQTT Messages
    useEffect(() => {
        // 1. Timeline Feed
        if (messages['history/1']) {
            try {
                const data = JSON.parse(messages['history/1']);
                if (data.type === 'timeline_feed' && data.data) {
                    // Aggregate consecutive messages from the same role
                    const rawData = data.data as any[];
                    if (rawData.length === 0) {
                        setTimeline([]);
                    } else {
                        const merged: any[] = [];
                        let current = rawData[0];

                        for (let i = 1; i < rawData.length; i++) {
                            const next = rawData[i];
                            const isSameRole = current.role === next.role;
                            // Check time difference (5 seconds threshold for "streamed" phrases)
                            const timeDiff = Math.abs(new Date(current.timestamp).getTime() - new Date(next.timestamp).getTime());

                            if (isSameRole && timeDiff < 5000) {
                                // Merge content
                                current = {
                                    ...current,
                                    content: current.content.trim() + ' ' + next.content.trim()
                                };
                            } else {
                                merged.push(current);
                                current = next;
                            }
                        }
                        merged.push(current);
                        setTimeline(merged);
                    }
                    setLoadingTimeline(false);
                }
            } catch (e) {
                console.error('Failed to parse timeline:', e);
                setLoadingTimeline(false);
            }
        }

        // 2. Activity Search Response (v2.0: Direct array OR object with results)
        if (messages['memory/activity/response']) {
            try {
                const data = JSON.parse(messages['memory/activity/response']);
                // Handle both array and object with .results
                const results = Array.isArray(data) ? data : (data.results || []);
                setActivityLog(results);
                setLoadingActivity(false);
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

        // 4. v2.0: Base Memory Response
        if (messages['memory/base/response']) {
            try {
                const data = JSON.parse(messages['memory/base/response']);
                if (data.data) {
                    setBaseMemory(data.data);
                } else if (data.error) {
                    console.warn('Base memory error:', data.error);
                }
                setLoadingBase(false);
            } catch (e) {
                console.error('Failed to parse base memory:', e);
                setLoadingBase(false);
            }
        }

        // 5. v2.0: Context Response
        if (messages['memory/context/response']) {
            try {
                const data = JSON.parse(messages['memory/context/response']);
                if (data.data) {
                    setContextData(data.data);
                } else if (data.error) {
                    console.warn('Context error:', data.error);
                }
                setLoadingContext(false);
            } catch (e) {
                console.error('Failed to parse context:', e);
                setLoadingContext(false);
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
            publish('memory/activity/search', JSON.stringify({ query: "*", limit: 50 }));
            publish('memory/stats/request', 'GET');
        } else if (activeTab === 'base') {
            setLoadingBase(true);
            publish('memory/base/request', 'GET');
        } else if (activeTab === 'recent') {
            setLoadingContext(true);
            publish('memory/context/request', 'GET');
        }
    }, [activeTab, publish]);

    const handleActivitySearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingActivity(true);
        publish('memory/activity/search', JSON.stringify({
            query: searchQuery || '*',
            limit: 20
        }));
    };

    // Confidence bar color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.6) return 'bg-yellow-500';
        return 'bg-orange-500';
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

                {/* Tabs - v2.0: All 4 tabs enabled */}
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
                                    <p className="text-sm text-slate-500">Loading timeline...</p>
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">history</span>
                                    <p>No timeline data available. Start a conversation with Alex.</p>
                                </div>
                            ) : (
                                <div className="relative pl-8 border-l-2 border-pink-100 dark:border-slate-700 space-y-8">
                                    {timeline.map((item, i) => {
                                        const ts = item.timestamp ? new Date(item.timestamp) : new Date();
                                        const dateStr = ts.toLocaleDateString();
                                        const timeStr = ts.toLocaleTimeString();
                                        const isUser = item.role === 'user';

                                        return (
                                            <div key={i} className="relative group">
                                                <div className={`absolute -left-[41px] top-1 size-5 rounded-full border-4 border-white dark:border-[#1a0f14] ${isUser ? 'bg-blue-500' : 'bg-teal-500'} group-hover:scale-125 transition-transform shadow-sm`}></div>
                                                <div className="flex flex-col gap-1 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dateStr} • {timeStr}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isUser ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                                            {item.role || 'system'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-pink-50 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.content || item.text || '(No content)'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total</div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Memories</div>
                                        <div className="text-2xl font-black text-teal-500">{stats.memories?.total || 0}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Notes</div>
                                        <div className="text-2xl font-black text-purple-500">{stats.by_activity_type?.note_taken || stats.by_type?.note_taken || 0}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Auth Events</div>
                                        <div className="text-2xl font-black text-amber-500">{stats.by_activity_type?.auth_event || stats.by_type?.auth_event || 0}</div>
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
                                <div className="space-y-3">
                                    {activityLog.map((log) => {
                                        // Format activity data nicely instead of raw JSON
                                        const formatActivityData = (data: any) => {
                                            if (!data) return null;
                                            const entries = Object.entries(data);
                                            if (entries.length === 0) return null;

                                            return (
                                                <div className="flex flex-wrap gap-2">
                                                    {entries.map(([key, value]) => (
                                                        <span
                                                            key={key}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${key === 'status' && value === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                key === 'status' && value === 'timeout' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    key === 'service' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                        key === 'integrations_active' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                            key === 'session_id' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            <span className="opacity-60">{key.replace('_', ' ')}:</span>
                                                            <span className="font-bold">{String(value)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-3 items-center">
                                                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${log.activity_type === 'note_taken' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            log.activity_type === 'auth_event' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                log.activity_type === 'dashboard_access' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
                                                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            <span className="material-symbols-outlined text-lg">
                                                                {log.activity_type === 'note_taken' ? 'edit_note' :
                                                                    log.activity_type === 'auth_event' ? 'vpn_key' :
                                                                        log.activity_type === 'dashboard_access' ? 'dashboard' : 'list'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-white capitalize">{log.activity_type?.replace(/_/g, ' ')}</div>
                                                            <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {formatActivityData(log.activity_data)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- BASE MEMORY (v2.0) --- */}
                    {activeTab === 'base' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Base Memory</h2>
                                    <p className="text-slate-500">Core facts and preferences learned about you.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setLoadingBase(true);
                                        publish('memory/base/request', 'GET');
                                    }}
                                    className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>

                            {loadingBase ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="size-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm text-slate-500">Loading base memory...</p>
                                </div>
                            ) : !baseMemory ? (
                                <div className="text-center py-20 text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">psychology</span>
                                    <p>No base memory available yet. Interact with Alex to build memories.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Helper to render sections */}
                                    {(() => {
                                        const sections = [
                                            { key: 'identity', label: 'Identity', icon: 'person', color: 'text-blue-600 dark:text-blue-400' },
                                            { key: 'deep_facts', label: 'Deep Facts', icon: 'lightbulb', color: 'text-purple-600 dark:text-purple-400' },
                                            { key: 'preferences', label: 'Preferences', icon: 'favorite', color: 'text-amber-600 dark:text-amber-400' }
                                        ];

                                        return sections.map((section, idx) => {
                                            const sectionData = (baseMemory as any)[section.key] || (baseMemory as any)[section.key === 'identity' ? 'identities' : section.key];

                                            // Handle Categorized vs Legacy
                                            const isCategorized = sectionData && !Array.isArray(sectionData);
                                            const items = isCategorized ? Object.entries(sectionData) : (sectionData ? [['All Items', sectionData]] : []);

                                            return (
                                                <div key={section.key} className={`glass-premium rounded-2xl p-6 shadow-sm h-fit hover:shadow-lg transition-shadow duration-300 animate-fade-up stagger-${(idx % 3) + 1}`}>
                                                    <h3 className={`text-lg font-bold ${section.color} mb-4 flex items-center gap-2`}>
                                                        <span className="material-symbols-outlined">{section.icon}</span>
                                                        {section.label}
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {items.map(([category, memories]: [string, any[]], i: number) => (
                                                            <div key={i}>
                                                                {isCategorized && <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{category}</h4>}
                                                                <ul className="space-y-2">
                                                                    {memories && memories.map((mem: any, j: number) => (
                                                                        <li key={j} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300 group">
                                                                            <span className="text-slate-400">•</span>
                                                                            <div className="flex-1">
                                                                                <span>{mem.text}</span>
                                                                                {/* Confidence Bar */}
                                                                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-700/50 rounded-full mt-1 overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full rounded-full ${mem.confidence > 0.8 ? 'bg-amber-400' : 'bg-slate-300'} transition-all duration-1000`}
                                                                                        style={{ width: `${(mem.confidence || 0) * 100}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                        {(!sectionData || items.length === 0) && <p className="text-sm text-slate-400 italic">No data recorded.</p>}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- RECENT CONTEXT (v2.0) --- */}
                    {activeTab === 'recent' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Recent Context</h2>
                                    <p className="text-slate-500">The active conversation buffer sent to the LLM.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setLoadingContext(true);
                                        publish('memory/context/request', 'GET');
                                    }}
                                    className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>

                            {loadingContext ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="size-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm text-slate-500">Loading context window...</p>
                                </div>
                            ) : !contextData ? (
                                <div className="text-center py-20 text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">chat</span>
                                    <p>No context available. Start a conversation with Alex.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Conversation Buffer */}
                                    {contextData.conversation_buffer && contextData.conversation_buffer.length > 0 && (
                                        <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 overflow-auto">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Conversation Buffer</h3>
                                            <div className="font-mono text-sm space-y-2">
                                                {contextData.conversation_buffer.map((line, i) => (
                                                    <div key={i} className={`${line.startsWith('User:') ? 'text-blue-400' : line.startsWith('Model:') ? 'text-green-400' : 'text-slate-400'}`}>
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Contexts - Expandable Cards */}
                                    {contextData.recent_contexts && contextData.recent_contexts.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Context Summaries</h3>
                                            <div className="space-y-3">
                                                {contextData.recent_contexts.map((ctx, i) => {
                                                    // Parse the transcript into chat messages
                                                    const parseTranscript = (text: string) => {
                                                        if (!text) return [];
                                                        // Remove "Session ended. Transcript: " prefix
                                                        const cleaned = text.replace(/^Session ended\.\s*Transcript:\s*/i, '');
                                                        // Split by "User:" or "Alex:" or "Model:"
                                                        const parts = cleaned.split(/(?=User:|Alex:|Model:)/g).filter(p => p.trim());
                                                        return parts.map(part => {
                                                            const isUser = part.startsWith('User:');
                                                            const content = part.replace(/^(User:|Alex:|Model:)\s*/, '').trim();
                                                            return { isUser, content };
                                                        }).filter(m => m.content);
                                                    };

                                                    const messages = parseTranscript(ctx.text);
                                                    const preview = messages.slice(0, 2).map(m => m.content).join(' ').slice(0, 60);

                                                    // Safe date formatting
                                                    const formatDate = (timestamp: string) => {
                                                        if (!timestamp) return 'Recent';
                                                        const date = new Date(timestamp);
                                                        if (isNaN(date.getTime())) return 'Recent';
                                                        return date.toLocaleString();
                                                    };

                                                    return (
                                                        <details key={i} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                                            <summary className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors list-none">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white">
                                                                            <span className="material-symbols-outlined text-lg">chat</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-slate-800 dark:text-white text-sm">
                                                                                Conversation #{contextData.recent_contexts.length - i}
                                                                            </div>
                                                                            <div className="text-xs text-slate-400 truncate max-w-[300px]">
                                                                                {preview || 'No preview'}...
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-400">{formatDate(ctx.timestamp)}</span>
                                                                        <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                                                                    </div>
                                                                </div>
                                                            </summary>

                                                            {/* Expanded Chat View */}
                                                            <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50 max-h-[400px] overflow-y-auto">
                                                                <div className="space-y-3">
                                                                    {messages.length > 0 ? messages.map((msg, j) => (
                                                                        <div key={j} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                                                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.isUser
                                                                                ? 'bg-primary text-white rounded-br-md'
                                                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md'
                                                                                }`}>
                                                                                <div className="text-[10px] font-bold opacity-60 mb-1">
                                                                                    {msg.isUser ? 'You' : 'Alex'}
                                                                                </div>
                                                                                {msg.content}
                                                                            </div>
                                                                        </div>
                                                                    )) : (
                                                                        <p className="text-slate-400 text-sm text-center">No messages to display</p>
                                                                    )}
                                                                </div>
                                                                {ctx.session_id && (
                                                                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                                        <span className="text-[10px] font-mono text-slate-400">Session: {ctx.session_id}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </details>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Memory;