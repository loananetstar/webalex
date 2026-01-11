import React, { useState, useRef } from 'react';

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
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // 3D Tilt with cursor gravity
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * 8, y: -x * 8 }); // Subtle 8deg max tilt
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // Status-based gradient colors (shader-style reactive)
    const getStatusGradient = () => {
        if (heartbeat.is_active) {
            return 'from-pink-500 via-purple-600 to-indigo-600';
        } else if (heartbeat.is_connected) {
            return 'from-cyan-400 via-blue-500 to-indigo-500';
        }
        return 'from-slate-400 via-slate-500 to-slate-600';
    };

    const getGlowClass = () => {
        if (heartbeat.is_active) return 'glow-active';
        if (heartbeat.is_connected) return 'glow-standby';
        return '';
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d',
            }}
            className="lg:col-span-1 relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl dark:shadow-soft border border-white/50 dark:border-pink-900/20 p-8 flex flex-col items-center gap-8 text-center group transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/10"
        >
            {/* Animated Gradient Top Bar - Shader reactive */}
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getStatusGradient()} animate-gradient transition-opacity duration-500 ${heartbeat.is_active || heartbeat.is_connected ? 'opacity-100' : 'opacity-30'}`}></div>

            {/* Ambient Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {heartbeat.is_active && (
                    <>
                        <div className="absolute top-1/4 left-1/4 size-2 rounded-full bg-pink-400/30 animate-float" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute top-1/3 right-1/4 size-1.5 rounded-full bg-purple-400/30 animate-float" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute bottom-1/4 left-1/3 size-1 rounded-full bg-indigo-400/30 animate-float-slow" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute top-1/2 right-1/3 size-2.5 rounded-full bg-pink-300/20 animate-float-slow" style={{ animationDelay: '0.5s' }}></div>
                    </>
                )}
            </div>

            {/* Background Blur Orbs */}
            <div className={`absolute -top-32 -right-32 size-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${heartbeat.is_active ? 'bg-pink-500/20' : heartbeat.is_connected ? 'bg-blue-500/15' : 'bg-slate-500/10'}`}></div>
            <div className={`absolute -bottom-32 -left-32 size-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${heartbeat.is_active ? 'bg-purple-500/20' : heartbeat.is_connected ? 'bg-cyan-500/15' : 'bg-slate-500/10'}`}></div>

            {/* Main Status Circle with Ripple Effect */}
            <div className="relative flex-shrink-0 mt-2" style={{ transform: 'translateZ(30px)' }}>
                {/* Concentric Ripple Rings */}
                {(heartbeat.is_active || heartbeat.is_connected) && (
                    <>
                        <div className={`absolute inset-0 rounded-full ${heartbeat.is_active ? 'bg-pink-500/20' : 'bg-blue-500/20'} animate-ripple`}></div>
                        <div className={`absolute inset-0 rounded-full ${heartbeat.is_active ? 'bg-pink-500/15' : 'bg-blue-500/15'} animate-ripple`} style={{ animationDelay: '0.5s' }}></div>
                        <div className={`absolute inset-0 rounded-full ${heartbeat.is_active ? 'bg-pink-500/10' : 'bg-blue-500/10'} animate-ripple`} style={{ animationDelay: '1s' }}></div>
                    </>
                )}

                {/* Spinning Orbit Ring */}
                {heartbeat.is_active && (
                    <div className="absolute -inset-6 rounded-full border-2 border-dashed border-pink-400/30 animate-[spin_8s_linear_infinite]"></div>
                )}

                {/* Core Circle with Glow */}
                <div className={`size-32 rounded-full flex items-center justify-center relative z-10 liquid-morph ${getGlowClass()} ${heartbeat.is_active
                    ? 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 scale-105'
                    : heartbeat.is_connected
                        ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 scale-100'
                        : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 scale-95 grayscale-[30%]'
                    }`}>
                    {/* Inner Glass Shine */}
                    <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>

                    {/* Shimmer Overlay */}
                    {heartbeat.is_active && (
                        <div className="absolute inset-0 rounded-full animate-shimmer"></div>
                    )}

                    {/* Icon */}
                    <span className={`material-symbols-outlined text-5xl transition-all duration-500 ${heartbeat.is_active || heartbeat.is_connected
                        ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        smart_toy
                    </span>

                    {/* Pulse Indicator */}
                    {heartbeat.is_active && (
                        <div className="absolute top-2 right-2 size-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-500/50"></div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute -bottom-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 liquid-morph ${heartbeat.is_active
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-pink-300 shadow-pink-500/30'
                        : heartbeat.is_connected
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white border-blue-300 shadow-blue-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                        }`}>
                        {heartbeat.is_active ? 'ACTIVE' : heartbeat.is_connected ? 'STANDBY' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            {/* Content with Z-depth */}
            <div className="flex flex-col gap-4 w-full relative z-10 items-center" style={{ transform: 'translateZ(20px)' }}>
                <div className="flex flex-col gap-1">
                    <h2 className={`text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r ${heartbeat.is_active ? 'from-pink-500 to-purple-500' : heartbeat.is_connected ? 'from-blue-400 to-cyan-400' : 'from-slate-500 to-slate-600'} liquid-morph`}>
                        ALEX CORE
                    </h2>
                    <p className={`text-sm font-medium transition-colors duration-300 ${heartbeat.is_active ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                        {heartbeat.active_status_message || (heartbeat.is_active ? "Systems Nominal" : heartbeat.is_connected ? "Ready to Initialize" : "Systems Offline")}
                    </p>
                </div>

                {/* Status Metrics */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
                    {/* Battery */}
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 magnetic-hover">
                        <span className={`material-symbols-outlined text-lg mb-1 transition-colors duration-300 ${heartbeat.battery_level > 20 ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                            {heartbeat.battery_level > 80 ? 'battery_full' : heartbeat.battery_level > 20 ? 'battery_5_bar' : 'battery_alert'}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{heartbeat.battery_level}%</span>
                    </div>
                    {/* Connection */}
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 magnetic-hover">
                        <span className={`material-symbols-outlined text-lg mb-1 transition-colors duration-300 ${heartbeat.is_connected ? 'text-blue-500' : 'text-slate-400'}`}>
                            {heartbeat.is_connected ? 'wifi' : 'wifi_off'}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{heartbeat.is_connected ? 'Conn' : 'Lost'}</span>
                    </div>
                </div>

                {/* Action Button with Shimmer */}
                <div className="w-full mt-2 px-4">
                    <button
                        onClick={onToggle}
                        className={`group w-full relative overflow-hidden px-5 py-4 rounded-2xl font-bold transition-all duration-300 shadow-md transform active:scale-95 magnetic-hover ${heartbeat.is_active
                            ? 'bg-white text-pink-600 border-2 border-pink-100 hover:border-pink-200 hover:bg-pink-50'
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/25'
                            }`}>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {/* Hover Sweep */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <span className={`material-symbols-outlined transition-transform duration-300 ${heartbeat.is_active ? '' : 'group-hover:translate-x-1'}`}>
                                {heartbeat.is_active ? 'power_settings_new' : 'play_arrow'}
                            </span>
                            <span>{heartbeat.is_active ? 'SHUTDOWN SYSTEM' : 'INITIALIZE'}</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentStatusCard;
