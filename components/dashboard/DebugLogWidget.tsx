import React, { useEffect, useState, useRef } from 'react';
import { useMqtt } from '../../context/MqttContext';

interface LogEntry {
    time: string;
    topic: string;
    payload: string;
}

const DebugLogWidget: React.FC = () => {
    const { lastMessage } = useMqtt();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (lastMessage) {
            const newLog = {
                time: new Date().toLocaleTimeString(),
                topic: lastMessage.topic,
                payload: lastMessage.payload.substring(0, 100) + (lastMessage.payload.length > 100 ? '...' : '')
            };
            setLogs(prev => [newLog, ...prev].slice(0, 20)); // Keep last 20
        }
    }, [lastMessage]);

    return (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs h-64 flex flex-col shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                <span className="font-bold text-white">MQTT Debug Log</span>
                <span className="text-slate-500">Last 20 messages</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {logs.length === 0 && <span className="text-slate-600 italic">No messages received yet...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 hover:bg-white/5 p-1 rounded">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span className="text-teal-400 shrink-0 font-bold">{log.topic}</span>
                        <span className="text-slate-400 break-all">{log.payload}</span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};

export default DebugLogWidget;
