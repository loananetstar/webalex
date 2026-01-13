import React, { useState, useEffect } from 'react';
import { useMqtt } from '../context/MqttContext';

const Settings: React.FC = () => {
    const { isConnected, client } = useMqtt();
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [notifications, setNotifications] = useState(true);
    const [autoConnect, setAutoConnect] = useState(true);
    const [debugMode, setDebugMode] = useState(false);

    // Initial theme check
    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        if (newTheme === 'system') {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else if (newTheme === 'dark') {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
        } else {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto w-full custom-scrollbar">
            <div className="w-full flex justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col max-w-[1024px] w-full gap-8">

                    {/* Header */}
                    <header className="pb-6 border-b border-pink-200 dark:border-pink-900/30">
                        <h1 className="text-text-main-light dark:text-text-main-dark text-3xl sm:text-4xl font-extrabold tracking-tight">Settings</h1>
                        <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium opacity-80 mt-2">
                            Configure system preferences and connection details.
                        </p>
                    </header>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* System Status Card */}
                        <div className="bg-white dark:bg-[#1a2c35] p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">hub</span>
                                System Status
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Connection State</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {isConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Protocol</span>
                                    <span className="font-mono text-xs text-slate-500">MQTT over WSS (TLS)</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Broker</span>
                                    <span className="font-mono text-xs text-slate-500">hivemq.cloud</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Client ID</span>
                                    <span className="font-mono text-xs text-slate-500 truncate max-w-[150px]">{client?.options?.clientId || '...'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Appearance Card */}
                        <div className="bg-white dark:bg-[#1a2c35] p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">palette</span>
                                Appearance
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Theme Preference</span>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => handleThemeChange('light')}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="material-symbols-outlined">light_mode</span>
                                            <span className="text-xs font-bold">Light</span>
                                        </button>
                                        <button
                                            onClick={() => handleThemeChange('dark')}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="material-symbols-outlined">dark_mode</span>
                                            <span className="text-xs font-bold">Dark</span>
                                        </button>
                                        <button
                                            onClick={() => handleThemeChange('system')}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="material-symbols-outlined">devices</span>
                                            <span className="text-xs font-bold">System</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* App Preferences */}
                        <div className="bg-white dark:bg-[#1a2c35] p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">tune</span>
                                Preferences
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Push Notifications</p>
                                        <p className="text-xs text-slate-500">Receive alerts for reminders and updates.</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(!notifications)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${notifications ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Auto-Connect</p>
                                        <p className="text-xs text-slate-500">Connect to MQTT broker on startup.</p>
                                    </div>
                                    <button
                                        onClick={() => setAutoConnect(!autoConnect)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${autoConnect ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${autoConnect ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Debug Mode</p>
                                        <p className="text-xs text-slate-500">Show advanced logs and developer tools.</p>
                                    </div>
                                    <button
                                        onClick={() => setDebugMode(!debugMode)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${debugMode ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${debugMode ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* About Info */}
                        <div className="bg-white dark:bg-[#1a2c35] p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-teal-500">info</span>
                                    About Alex
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    Alex is an advanced AI assistant designed to unify your digital life. Built with React, Python, and MQTT.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-xs text-slate-400 font-mono">
                                    <span>Version</span>
                                    <span>2.2.0 (Stable)</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-mono mt-2">
                                    <span>Build</span>
                                    <span>2026.01.12</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
