import React, { useState, useEffect } from 'react';
import { useMqtt } from '../context/MqttContext';

interface VoiceProfile {
    name: string;
    style: string;
}

// CSS Avatar mappings for all 15 voices from COMPLETE_MQTT_GUIDE.txt V2.1.0
const VOICE_AVATARS: Record<string, { gradient: string; ring: string }> = {
    // Premium HD Voices
    'Puck': { gradient: 'from-blue-400 to-cyan-300', ring: 'ring-cyan-200' },
    'Charon': { gradient: 'from-slate-600 to-slate-800', ring: 'ring-slate-300' },
    'Kore': { gradient: 'from-violet-400 to-purple-600', ring: 'ring-violet-200' },
    'Fenrir': { gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-200' },
    'Aoede': { gradient: 'from-purple-400 to-indigo-500', ring: 'ring-indigo-200' },
    // Classic Voices
    'Nova': { gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-200' },
    'Ursa': { gradient: 'from-rose-400 to-pink-500', ring: 'ring-rose-200' },
    'Vega': { gradient: 'from-yellow-300 to-amber-400', ring: 'ring-yellow-200' },
    'Pegasus': { gradient: 'from-indigo-500 to-blue-700', ring: 'ring-indigo-200' },
    'Orbit': { gradient: 'from-rose-500 to-pink-600', ring: 'ring-pink-200' },
    'Lyra': { gradient: 'from-pink-300 to-rose-400', ring: 'ring-pink-200' },
    'Orion': { gradient: 'from-teal-500 to-cyan-600', ring: 'ring-teal-200' },
    'Dipper': { gradient: 'from-stone-500 to-slate-700', ring: 'ring-stone-200' },
    'Eclipse': { gradient: 'from-fuchsia-500 to-purple-700', ring: 'ring-fuchsia-200' },
    'Capella': { gradient: 'from-emerald-300 to-teal-400', ring: 'ring-emerald-200' },
    // Fallback
    'default': { gradient: 'from-gray-400 to-gray-600', ring: 'ring-gray-200' }
};

const Personalization: React.FC = () => {
    const { publish, messages, isConnected } = useMqtt();
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [currentVoice, setCurrentVoice] = useState<string>('');
    const [voices, setVoices] = useState<VoiceProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Fetch voice list on mount
    useEffect(() => {
        if (isConnected) {
            publish('agent/voice/list', 'GET');
        }
    }, [isConnected, publish]);

    // Parse MQTT responses
    useEffect(() => {
        // Voice List Response
        if (messages['agent/voice/list/response']) {
            try {
                const data = JSON.parse(messages['agent/voice/list/response']);
                if (data.status === 'success' && data.voices) {
                    setVoices(data.voices);
                    setCurrentVoice(data.current_voice || '');
                    setSelectedVoice(data.current_voice || data.voices[0]?.name || '');
                }
                setIsLoading(false);
            } catch (e) {
                console.error('Failed to parse voice list:', e);
                setIsLoading(false);
            }
        }

        // Voice Set Status Response
        if (messages['agent/voice/status']) {
            try {
                const data = JSON.parse(messages['agent/voice/status']);
                setIsSaving(false);
                if (data.status === 'success') {
                    setCurrentVoice(data.voice);
                    setSaveStatus({ type: 'success', message: data.message || `Voice set to ${data.voice}` });
                } else {
                    setSaveStatus({ type: 'error', message: data.message || 'Failed to set voice' });
                }

                // Clear status after 3 seconds
                setTimeout(() => setSaveStatus(null), 3000);
            } catch (e) {
                console.error('Failed to parse voice status:', e);
                setIsSaving(false);
            }
        }
    }, [messages]);

    const handleSave = () => {
        if (!selectedVoice || isSaving) return;
        setIsSaving(true);
        setSaveStatus(null);
        publish('agent/voice/set', JSON.stringify({ voice: selectedVoice }));
    };

    const getAvatarStyle = (voiceName: string) => {
        return VOICE_AVATARS[voiceName] || VOICE_AVATARS['default'];
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto w-full custom-scrollbar">
            <div className="w-full flex justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col max-w-[1240px] w-full gap-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-pink-200 dark:border-pink-900/30">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-text-main-light dark:text-text-main-dark text-3xl sm:text-4xl font-extrabold tracking-tight">Personalize Alex</h1>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium opacity-80">
                                Choose the perfect voice for your AI companion.
                                {currentVoice && <span className="ml-2 text-primary font-bold">Current: {currentVoice}</span>}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || selectedVoice === currentVoice}
                            className={`group flex items-center justify-center gap-2 h-12 px-8 text-white text-base font-bold rounded-full transition-all shadow-lg transform
                                ${isSaving ? 'bg-slate-400 cursor-wait' : selectedVoice === currentVoice ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-pink hover:opacity-90 active:scale-95 hover:scale-105 shadow-pink-300/50 dark:shadow-none'}`}
                        >
                            {isSaving ? (
                                <>
                                    <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </header>

                    {/* Save Status Toast */}
                    {saveStatus && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${saveStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                            <span className="material-symbols-outlined">{saveStatus.type === 'success' ? 'check_circle' : 'error'}</span>
                            <span className="font-medium">{saveStatus.message}</span>
                        </div>
                    )}

                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                                <span className="material-symbols-outlined text-primary text-2xl">graphic_eq</span>
                            </div>
                            <h2 className="text-text-main-light dark:text-text-main-dark text-2xl font-bold">Voice Character</h2>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-slate-500">Loading available voices...</p>
                            </div>
                        ) : voices.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">mic_off</span>
                                <p>No voices available. Please check backend connection.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {voices.map((voice) => {
                                    const isSelected = selectedVoice === voice.name;
                                    const isCurrent = currentVoice === voice.name;
                                    const avatarStyle = getAvatarStyle(voice.name);

                                    return (
                                        <div
                                            key={voice.name}
                                            onClick={() => setSelectedVoice(voice.name)}
                                            className={`relative group cursor-pointer rounded-3xl p-8 transition-all duration-500 border-2 tilt-card
                                                ${isSelected
                                                    ? 'bg-white dark:bg-slate-800 border-primary shadow-2xl shadow-pink-200/50 dark:shadow-none ring-8 ring-pink-400/10'
                                                    : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-pink-200 dark:hover:border-slate-700 hover:shadow-xl'
                                                }`}
                                        >
                                            <div className="tilt-card-inner">
                                                {isCurrent && (
                                                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                        Active
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-6">
                                                    {/* CSS Generated Avatar */}
                                                    <div className="relative">
                                                        {/* Ripple Effect for Selected */}
                                                        {isSelected && (
                                                            <>
                                                                <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ripple"></div>
                                                                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ripple" style={{ animationDelay: '0.5s' }}></div>
                                                            </>
                                                        )}

                                                        <div className={`size-20 rounded-2xl overflow-hidden relative shadow-lg ${isSelected ? 'ring-4 ring-primary/20' : ''} transition-all`}>
                                                            {/* Gradient Background */}
                                                            <div className={`absolute inset-0 bg-gradient-to-br ${avatarStyle.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}></div>

                                                            {/* Design Accents */}
                                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                                            <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 blur-xl rounded-full translate-x-4 -translate-y-4"></div>
                                                            <div className="absolute bottom-0 left-0 w-8 h-8 bg-black/10 blur-lg rounded-full -translate-x-2 translate-y-2"></div>

                                                            {/* Initial Letter */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-3xl font-black text-white drop-shadow-md">{voice.name[0]}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="bg-primary text-white p-1 rounded-full animate-in zoom-in spin-in-90 duration-500">
                                                            <span className="material-symbols-outlined text-[20px]">check</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1 mb-4">
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{voice.name}</h3>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${avatarStyle.gradient}`}>
                                                        {voice.style?.split('(')[0]?.trim() || 'Voice'}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                                    "{voice.style}"
                                                </p>

                                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-xs font-bold text-slate-400 hover:text-primary flex items-center gap-1 magnetic-hover">
                                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                        Preview
                                                    </button>
                                                    <span className="text-xs font-medium text-primary">
                                                        {isSelected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <div className="border-t border-pink-100 dark:border-slate-800 pt-8 mt-4">
                        <div className="flex flex-col gap-4 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined text-2xl">warning</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                        Deleting your account will remove all memory streams, notes, and connected services integration. This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={() => alert('Request sent to admin to delete account.')}
                                        className="px-5 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">delete_forever</span>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Personalization;