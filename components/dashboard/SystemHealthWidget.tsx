import React, { useEffect, useState } from 'react';

interface HealthData {
    status: 'ok' | 'degraded';
    uptime_sec: number;
    mqtt_connected: boolean;
    agent_running: boolean;
    timestamp: string;
}

const SystemHealthWidget: React.FC = () => {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [error, setError] = useState(false);

    const fetchHealth = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8033/health');
            if (!res.ok) throw new Error('Health check failed');
            const data = await res.json();
            setHealth(data);
            setError(false);
        } catch (err) {
            setError(true);
            setHealth(null);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-6 border border-red-100 dark:border-red-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500 text-3xl">dns</span>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-red-200">System Offline</h3>
                        <p className="text-xs text-slate-500 dark:text-red-300">Backend health check failed</p>
                    </div>
                </div>
                <button onClick={fetchHealth} className="text-red-500 hover:text-red-600 text-sm font-bold">Retry</button>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="bg-white dark:bg-[#1a0f14] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-4 bg-slate-100 dark:bg-slate-700 w-1/2 mb-2 rounded"></div>
                <div className="h-3 bg-slate-50 dark:bg-slate-800 w-1/3 rounded"></div>
            </div>
        );
    }

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="bg-white dark:bg-[#1a0f14] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 w-1 h-full ${health.status === 'ok' ? 'bg-gradient-to-b from-teal-400 to-teal-500' : 'bg-orange-500'}`}></div>

            <div className="flex items-start justify-between mb-4 pl-3">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">System Health</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        {health.status === 'ok' ? 'Operational' : 'Degraded'}
                    </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${health.status === 'ok' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                    v2.1
                </span>
            </div>

            <div className="space-y-3 pl-3">
                {/* Uptime */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">schedule</span> Uptime
                    </span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{formatUptime(health.uptime_sec)}</span>
                </div>

                {/* MQTT Backend Status */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">hub</span> MQTT Bridge
                    </span>
                    <span className={`font-bold ${health.mqtt_connected ? 'text-teal-500' : 'text-red-500'}`}>
                        {health.mqtt_connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>

                {/* Agent Service Status */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">smart_toy</span> Agent Service
                    </span>
                    <span className={`font-bold ${health.agent_running ? 'text-purple-500' : 'text-slate-400'}`}>
                        {health.agent_running ? 'Active' : 'Idle'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthWidget;
