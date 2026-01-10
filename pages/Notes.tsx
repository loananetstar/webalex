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
                // Only 'RECORDING' means we are capturing audio.
                // TRANSCRIBING/PROCESSING means we stopped.
                setRecording(data.status === 'RECORDING');
            } catch (e) {
                console.error('Failed to parse note status:', e);
            }
        }

        // gacor/1 - Final note result (v4.0 Rule: Check for error)
        if (messages['gacor/1']) {
            try {
                const data = JSON.parse(messages['gacor/1']);

                if (data.type === 'error') {
                    // Handle v4.0 Error Response
                    console.error('Note generation error:', data.message);
                    setNoteStatus({ status: 'ERROR', message: data.message });
                    setRecording(false);
                    return;
                }

                if (data.type === 'note_summary') {
                    setNoteResult(data);
                    setNoteStatus({ status: 'COMPLETE', progress: 100 }); // Ensure UI clears processing state
                    setRecording(false); // Safety clear

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
                    // Auto-select
                    setTimeout(() => {
                        document.getElementById(`note-${newNote.id}`)?.click();
                    }, 100);
                }
            } catch (e) {
                console.error('Failed to parse note result:', e);
            }
        }
    }, [messages]);

    const toggleRecording = () => {
        if (isProcessing) return; // Prevent action while processing

        if (!recording) {
            publish('/note/1', 'NOTEON');
        } else {
            publish('/note/1', 'NOTEOFF');
        }
    };

    // Helper to copy path
    const copyPath = (label: string, path: string | null) => {
        if (path) {
            navigator.clipboard.writeText(path);
            alert(`${label} location copied to clipboard:\n${path}`);
        }
    };

    const getStatusDisplay = () => {
        if (!noteStatus) return { text: 'IDLE', progress: 0, message: '' };
        const { status, progress = 0, message = '' } = noteStatus;

        switch (status) {
            case 'RECORDING': return { text: 'RECORDING', progress: 0, message: 'Recording audio...' };
            case 'TRANSCRIBING': return { text: 'TRANSCRIBING', progress, message: 'Converting speech to text...' };
            case 'PROCESSING': return { text: 'PROCESSING', progress, message: message || 'Generating summary...' };
            case 'COMPLETE': return { text: 'COMPLETE', progress: 100, message: 'Summary ready!' };
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
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Recordings</h3>
                        <div className="flex flex-col gap-2">
                            {recentList.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No recordings yet. Start your first session!</p>
                            ) : (
                                recentList.map((rec) => (
                                    <div
                                        key={rec.id}
                                        id={`note-${rec.id}`}
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

                {/* Main Content: Output / Detail View */}
                <section className="flex-1 overflow-y-auto p-6 md:p-10 relative">
                    {noteResult ? (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary View</span>
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-1">Session {new Date(noteResult.timestamp).toLocaleString()}</h2>
                                    <div className="flex gap-3 text-sm text-slate-500 mt-2">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {noteResult.duration_minutes} mins</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 border border-pink-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    AI Summary
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">{noteResult.preview_text}</p>

                                {/* Artifact Files (v4.0 - File Paths) */}
                                {noteResult.artifacts && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Generated Artifacts (Click to Copy Path):</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {noteResult.artifacts.master_guide && (
                                                <button onClick={() => copyPath('Master Guide', noteResult.artifacts.master_guide)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-purple-500 text-lg">description</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Master Guide</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.flashcards && (
                                                <button onClick={() => copyPath('Flashcards', noteResult.artifacts.flashcards)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-amber-500 text-lg">style</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Flashcards</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.quiz && (
                                                <button onClick={() => copyPath('Quiz', noteResult.artifacts.quiz)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-green-500 text-lg">quiz</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Quiz</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.mindmap && (
                                                <button onClick={() => copyPath('Mindmap', noteResult.artifacts.mindmap)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-blue-500 text-lg">account_tree</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Mindmap</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.cornell_notes && (
                                                <button onClick={() => copyPath('Cornell Notes', noteResult.artifacts.cornell_notes)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-orange-500 text-lg">grid_goldenratio</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Cornell Notes</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.spaced_repetition && (
                                                <button onClick={() => copyPath('Spaced Repetition', noteResult.artifacts.spaced_repetition)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-teal-500 text-lg">update</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Spaced Rep.</span>
                                                </button>
                                            )}
                                            {noteResult.artifacts.citation_index && (
                                                <button onClick={() => copyPath('Citations', noteResult.artifacts.citation_index)} className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-pink-500 text-lg">format_quote</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Citations</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <div className="size-32 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-6xl">graphic_eq</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Select a recording</h3>
                            <p>Choose from the list or start a new one.</p>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
};

export default Notes;