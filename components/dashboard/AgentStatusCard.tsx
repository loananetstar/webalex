import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import RobotModel from '../RobotModel';

interface AgentStatusCardProps {
    heartbeat: {
        is_active: boolean;
        is_connected: boolean;
        battery_level: number;
        active_status_message: string;
    };
    onToggle: () => void;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ heartbeat, onToggle }) => {
    return (
        <div className="lg:col-span-1 relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl dark:shadow-soft border border-white/50 dark:border-pink-900/20 p-8 flex flex-col items-center gap-8 text-center group transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1">
            {/* Background Effects */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-opacity duration-300 ${heartbeat.is_active ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className="absolute -top-32 -right-32 size-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 size-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Main Status Circle */}
            <div className="relative flex-shrink-0 mt-2">
                {/* Outer Glow Ring - Pulse if Active or Standby */}
                {(heartbeat.is_active || heartbeat.is_connected) && (
                    <>
                        <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${heartbeat.is_active ? 'bg-pink-500/20' : 'bg-blue-500/20'}`}></div>
                        <div className={`absolute -inset-4 rounded-full border animate-[spin_4s_linear_infinite] opacity-50 ${heartbeat.is_active ? 'border-pink-500/30' : 'border-blue-500/30'}`}></div>
                    </>
                )}

                {/* Core Circle */}
                <div className={`size-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${heartbeat.is_active
                        ? 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 shadow-[0_0_40px_rgba(236,72,153,0.6)] scale-105'
                        : heartbeat.is_connected
                            ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-100'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner scale-100 grayscale'
                    }`}>
                    {/* Inner Glass Shine */}
                    <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>

                    {/* Icon */}
                    <span className={`material-symbols-outlined text-5xl transition-all duration-300 ${heartbeat.is_active || heartbeat.is_connected
                            ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}>
                        smart_toy
                    </span>

                    {/* Status Badge */}
                    <div className={`absolute -bottom-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${heartbeat.is_active
                            ? 'bg-white text-pink-600 border-pink-200'
                            : heartbeat.is_connected
                                ? 'bg-white text-blue-600 border-blue-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                        }`}>
                        {heartbeat.is_active ? 'ACTIVE' : heartbeat.is_connected ? 'STANDBY' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full relative z-10 items-center">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400">
                        ALEX CORE
                    </h2>
                    <p className={`text-sm font-medium transition-colors ${heartbeat.is_active ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                        {heartbeat.active_status_message || (heartbeat.is_active ? "Systems Nominal" : "Systems Offline")}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
                    {/* Battery */}
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800">
                        <span className={`material-symbols-outlined text-lg mb-1 ${heartbeat.battery_level > 20 ? 'text-green-500' : 'text-red-500'}`}>battery_full</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{heartbeat.battery_level}%</span>
                    </div>
                    {/* Conn */}
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800">
                        <span className={`material-symbols-outlined text-lg mb-1 ${heartbeat.is_connected ? 'text-blue-500' : 'text-slate-400'}`}>wifi</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{heartbeat.is_connected ? 'Conn' : 'Lost'}</span>
                    </div>
                </div>

                <div className="w-full mt-2 px-4">
                    <button
                        onClick={onToggle}
                        className={`group w-full relative overflow-hidden px-5 py-4 rounded-2xl font-bold transition-all duration-300 shadow-md transform active:scale-95 ${heartbeat.is_active
                            ? 'bg-white text-pink-600 border-2 border-pink-100 hover:border-pink-200 hover:bg-pink-50'
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/25'
                            }`}>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">{heartbeat.is_active ? 'power_settings_new' : 'play_arrow'}</span>
                            <span>{heartbeat.is_active ? 'SHUTDOWN SYSTEM' : 'INITIALIZE'}</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentStatusCard;
