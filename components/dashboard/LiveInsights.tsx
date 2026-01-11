import React from 'react';
import { useLiveInsights } from '../../hooks/useLiveInsights';

const LiveInsights: React.FC = () => {
    const { summary, topic } = useLiveInsights();

    if (!summary && !topic) return null;

    return (
        <div className="flex flex-col gap-4 animate-fade-up">
            {/* Topic Badges - Only show if confidence is high */}
            {topic && topic.confidence > 0.6 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20">
                        {topic.domain}
                    </span>
                    {topic.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs font-bold bg-white/50 dark:bg-white/10 border border-white/20 text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Live Summary Card */}
            {summary && (
                <div className="glass-premium rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">auto_awesome</span>
                    </div>

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live Context
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400">
                                {new Date(summary.timestamp).toLocaleTimeString()}
                            </span>
                        </div>

                        {/* The Main Summary */}
                        <div className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                            {summary.summary}
                        </div>

                        {/* Key Points */}
                        {summary.key_points.length > 0 && (
                            <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Key Points</h4>
                                <ul className="space-y-2">
                                    {summary.key_points.map((point, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="text-pink-500">•</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Items */}
                        {summary.action_items.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Action Items
                                </h4>
                                <ul className="space-y-2">
                                    {summary.action_items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-2.5 rounded-lg text-green-800 dark:text-green-300">
                                            <input type="checkbox" className="mt-1 rounded border-green-300 text-green-600 focus:ring-green-500" readOnly />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveInsights;
