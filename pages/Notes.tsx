import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';

const Notes: React.FC = () => {
    const { publish, messages } = useMqtt();
    const [recording, setRecording] = useState(false);
    const [noteStatus, setNoteStatus] = useState<any>(null); // From /note/status
    const [noteResult, setNoteResult] = useState<any>(null); // From gacor/1
    const [recentList, setRecentList] = useState<any[]>([]); // List of completed notes

    // Parse MQTT Messages
    useEffect(() => {
        // /note/status - Real-time status updates
        if (messages['/note/status']) {
            try {
                const data = JSON.parse(messages['/note/status']);
                setNoteStatus(data);

                // Update recording state based on status (Strict)
                setRecording(data.status === 'RECORDING');
            } catch (e) {
                console.error('Failed to parse note status:', e);
            }
        }

        // gacor/1 - Final note result
        if (messages['gacor/1']) {
            try {
                const data = JSON.parse(messages['gacor/1']);

                if (data.type === 'error') {
                    console.error('Note generation error:', data.message);
                    setNoteStatus({ status: 'ERROR', message: data.message });
                    setRecording(false);
                    return;
                }

                if (data.type === 'note_summary') {
                    setNoteResult(data);
                    setNoteStatus({ status: 'COMPLETE', progress: 100 });
                    setRecording(false);

                    // Add to recent list
                    const newNote = {
                        id: data.session_id,
                        title: `Session ${new Date(data.timestamp).toLocaleTimeString()}`,
                        date: 'Just now',
                        duration: `${data.duration_minutes} mins`,
                        summary: data.preview_text,
                        artifacts: data.artifacts
                    };
                    setRecentList(prev => [newNote, ...prev]);
                }
            } catch (e) {
                console.error('Failed to parse note result:', e);
            }
        }
    }, [messages]);

    const toggleRecording = () => {
        if (isProcessing) return;

        if (!recording) {
            publish('/note/1', 'NOTEON');
        } else {
            publish('/note/1', 'NOTEOFF');
        }
    };

    const copyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        // In a real app, show a toast here
        console.log('Copied path:', path);
    };

    const getStatusDisplay = () => {
        if (!noteStatus) return { text: 'IDLE', progress: 0, message: '' };
        const { status, progress = 0, message = '' } = noteStatus;

        switch (status) {
            case 'RECORDING': return { text: 'RECORDING', progress: 0, message: 'Recording audio...' };
            case 'TRANSCRIBING': return { text: 'TRANSCRIBING', progress, message: 'Converting speech to text...' };
            case 'PROCESSING': return { text: 'PROCESSING', progress, message: message || 'Generating artifacts...' };
            case 'COMPLETE': return { text: 'COMPLETE', progress: 100, message: 'Session complete!' };
            case 'ERROR': return { text: 'ERROR', progress: 0, message: message || 'Processing failed' };
            default: return { text: 'IDLE', progress: 0, message: '' };
        }
    };

    const statusDisplay = getStatusDisplay();
    const isProcessing = noteStatus?.status === 'TRANSCRIBING' || noteStatus?.status === 'PROCESSING';

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
                        <span className="material-symbols-outlined text-primary">mic</span> Smart Notes
                    </h1>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Recent Recordings */}
                <aside className="w-80 bg-white dark:bg-[#15232b] border-r border-pink-100 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden">
                    <div className="p-6 pb-4 border-b border-pink-50 dark:border-slate-800">
                        {/* Recording Button */}
                        <button
                            onClick={toggleRecording}
                            disabled={isProcessing}
                            className={`w-full relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all shadow-lg group ${isProcessing
                                ? 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 cursor-not-allowed opacity-80'
                                : recording
                                    ? 'bg-white border-2 border-red-100'
                                    : 'bg-gradient-to-br from-primary to-pink-600 dark:from-primary dark:to-purple-600 text-white hover:shadow-primary/30'
                                }`}
                        >
                            {recording && <span className="absolute inset-0 bg-red-500/10 animate-pulse"></span>}
                            <div className={`p-4 rounded-full transition-all ${isProcessing
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                : recording
                                    ? 'bg-red-100 text-red-500'
                                    : 'bg-white/20 text-white'
                                }`}>
                                <span className={`material-symbols-outlined text-3xl ${recording ? 'animate-pulse' : ''} ${isProcessing ? 'animate-spin' : ''}`}>
                                    {isProcessing ? 'sync' : recording ? 'stop' : 'mic'}
                                </span>
                            </div>
                            <div className="text-center relative z-10">
                                <span className={`block font-bold text-lg ${isProcessing
                                    ? 'text-slate-500'
                                    : recording
                                        ? 'text-red-500'
                                        : 'text-white'
                                    }`}>
                                    {isProcessing ? 'Processing...' : recording ? 'Stop Recording' : 'Start Recording'}
                                </span>
                                {recording && <span className="text-xs text-red-400 font-medium animate-pulse">Recording active...</span>}
                                {isProcessing && <span className="text-xs text-slate-400 font-medium">Please wait</span>}
                            </div>
                        </button>

                        {/* Processing Status */}
                        {isProcessing && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-300">
                                    <span>{statusDisplay.text}</span>
                                    <span>{statusDisplay.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${statusDisplay.progress}%` }}></div>
                                </div>
                                <p className="text-[10px] text-blue-400 leading-tight">{statusDisplay.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Retrieve Last Note Button (Guide Section 3.5) */}
                        <button
                            onClick={() => publish('/note/1', 'GET_SUMMARIZE')}
                            className="w-full mb-4 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">history</span>
                            Retrieve Last Note
                        </button>

                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Recordings</h3>
                        <div className="flex flex-col gap-2">
                            {recentList.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No recordings yet.</p>
                            ) : (
                                recentList.map((rec) => (
                                    <div
                                        key={rec.id}
                                        onClick={() => setNoteResult(recentList.find(r => r.id === rec.id))}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col gap-1 group ${noteResult?.session_id === rec.id
                                            ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800'
                                            : 'bg-white dark:bg-slate-800/50 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold text-sm ${noteResult?.session_id === rec.id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{rec.title}</span>
                                            <span className="text-[10px] text-slate-400 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded-md">{rec.duration}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">{rec.date}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 overflow-y-auto p-6 md:p-10 relative">
                    {noteResult ? (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Summary</span>
                                <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-1">Session {new Date(noteResult.timestamp).toLocaleString()}</h2>
                                <p className="text-slate-600 dark:text-slate-300 mt-4 text-lg leading-relaxed whitespace-pre-wrap">{noteResult.preview_text}</p>
                            </div>

                            {/* Artifacts List */}
                            <div className="bg-white dark:bg-[#1f2937] rounded-3xl border border-pink-100 dark:border-slate-700 shadow-sm overflow-hidden p-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">folder_open</span>
                                    Generated Artifacts
                                </h3>

                                {noteResult.artifacts ? (
                                    <div className="space-y-3">
                                        {Object.entries(noteResult.artifacts).map(([key, path]) => (
                                            path && (
                                                <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className="material-symbols-outlined text-slate-400">description</span>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200 capitalize">{key.replace('_', ' ')}</div>
                                                            <div className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-md font-mono">{String(path)}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => copyPath(String(path))}
                                                        className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors text-slate-500"
                                                        title="Copy Path"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">content_copy</span>
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic">No artifacts generated for this session.</p>
                                )}
                            </div>

                            {/* Stats */}
                            {noteResult.stats && (
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Flashcards</span>
                                        <p className="text-2xl font-black text-amber-500">{noteResult.stats.total_flashcards || 0}</p>
                                    </div>
                                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400 font-bold uppercase">AI Agents</span>
                                        <p className="text-2xl font-black text-purple-500">{noteResult.stats.agents_successful || 0}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <span className="material-symbols-outlined text-6xl mb-4">graphic_eq</span>
                            <h3 className="text-xl font-bold">Select a recording</h3>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Notes;