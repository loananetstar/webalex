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
        <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-pink-50 dark:from-[#2d1b22] dark:to-[#1f1016] shadow-soft dark:shadow-none border border-white dark:border-pink-900/30 p-6 flex flex-col items-center gap-6 text-center">
            {/* Background Blur */}
            <div className="absolute -top-24 -right-24 size-64 bg-pink-300/20 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative flex-shrink-0 mt-4">
                {heartbeat.is_active && <div className="size-32 rounded-full bg-primary/10 animate-soft-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>}
                <div className={`size-24 rounded-full bg-gradient-to-tr ${heartbeat.is_active ? 'from-primary to-accent-pink' : 'from-slate-300 to-slate-400 grayscale'} shadow-lg shadow-primary/40 relative z-10 flex items-center justify-center border-4 border-white/20 transition-all duration-500`}>
                    <span className="material-symbols-outlined text-white text-4xl drop-shadow-md">smart_toy</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full relative z-10 items-center">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-pink-950 dark:text-white">Agent Status: <span className={heartbeat.is_active ? "text-primary" : "text-slate-500"}>{heartbeat.is_active ? "Active" : "Standby"}</span></h2>
                    <p className="text-pink-800/60 dark:text-pink-200/60 text-sm max-w-[200px] mx-auto leading-tight">
                        {heartbeat.active_status_message}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                    <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-900/30 shadow-sm">
                        <span className="material-symbols-outlined text-green-500 text-sm">battery_full</span>
                        <span className="text-sm font-bold text-pink-900 dark:text-pink-100">{heartbeat.battery_level}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-900/30 shadow-sm">
                        <span className="text-sm font-bold text-pink-900 dark:text-pink-100">{heartbeat.is_connected ? 'Online' : 'Offline'}</span>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30">
                            <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                                <ambientLight intensity={0.8} />
                                <pointLight position={[5, 5, 5]} intensity={0.5} />
                                <Environment preset="city" />
                                <RobotModel scale={[0.35, 0.35, 0.35]} position={[0, -0.2, 0]} rotation={[0, 0, 0]} />
                            </Canvas>
                        </div>
                    </div>
                </div>

                <div className="w-full mt-2">
                    <button
                        onClick={onToggle}
                        className={`w-full ${heartbeat.is_active ? 'bg-white text-pink-900 hover:bg-pink-50' : 'bg-primary text-white hover:bg-primary-dark'} px-5 py-3 rounded-xl font-bold border border-pink-200 dark:border-pink-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95`}>
                        <span className="material-symbols-outlined text-[20px]">{heartbeat.is_active ? 'power_settings_new' : 'play_arrow'}</span>
                        {heartbeat.is_active ? 'Turn Off Agent' : 'Wake Up Alex'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentStatusCard;
