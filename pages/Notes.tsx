import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';
import MermaidChart from '../components/MermaidChart';
import FlashcardDeck from '../components/FlashcardDeck';

// v2.0: Artifacts are now INLINE CONTENT (not file paths!)
// No more file fetching needed.

interface Flashcard {
    front: string;
    back: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

interface NoteSession {
    id: string;
    timestamp: string;
    duration_minutes: number;
    preview_text: string;
    // v2.0 Inline Artifacts
    master_guide: string | null;
    flashcards: Flashcard[] | null;
    quiz: QuizQuestion[] | null;
    mindmap: string | null;
    cornell_notes: string | null;
    spaced_repetition: any[] | null;
    citation_index: any[] | null;
    stats?: { total_flashcards?: number; agents_successful?: number };
}

// --- SUB-COMPONENTS FOR ENHANCED UI ---

const SummaryViewer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-4 font-sans leading-relaxed text-slate-700 dark:text-slate-300">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                // H1: # Title
                if (trimmed.startsWith('# ')) {
                    return <h1 key={i} className="text-4xl font-black text-slate-900 dark:text-white mb-6 mt-8 border-b-4 border-primary/20 pb-2">{trimmed.replace('# ', '')}</h1>;
                }
                // H2: ## Subtitle
                if (trimmed.startsWith('## ')) {
                    return <h2 key={i} className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-10 mb-4">{trimmed.replace('## ', '')}</h2>;
                }
                // H3: ### Header
                if (trimmed.startsWith('### ')) {
                    return <h3 key={i} className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{trimmed.replace('### ', '')}</h3>;
                }
                // Bullet points
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-3 ml-4">
                            <span className="text-primary font-bold">•</span>
                            <p>{trimmed.replace(/^[-*]\s/, '')}</p>
                        </div>
                    );
                }
                // Bold text replacement
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i}>
                        {parts.map((part, pi) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={pi} className="text-slate-900 dark:text-white font-black">{part.slice(2, -2)}</strong>
                                : part
                        )}
                    </p>
                );
            })}
        </div>
    );
};

const CornellViewer: React.FC<{ text: string }> = ({ text }) => {
    // Attempt to split into Cues, Notes, Summary
    const sections = text.split(/(?=## CUES|## NOTES|## SUMMARY|## Cues|## Notes|## Summary)/i);

    const getSectionContent = (title: string) => {
        const section = sections.find(s => s.toLowerCase().includes(title.toLowerCase()));
        return section ? section.replace(new RegExp(`## ${title}`, 'i'), '').trim() : '';
    };

    const cues = getSectionContent('Cues');
    const notes = getSectionContent('Notes') || sections[0]; // Fallback to full text if no split
    const summary = getSectionContent('Summary');

    // Helper to render markdown lines
    const renderMarkdown = (content: string) => {
        return content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-4"></div>;

            // Clean up headers if they slipped in (like ## Cornell Notes)
            if (trimmed.startsWith('#')) return null;

            if (trimmed.startsWith('- ') || trimmed.startsWith('-- ')) {
                const textPart = trimmed.replace(/^--?\s/, '');
                const parts = textPart.split(/(\*\*.*?\*\*)/g);

                return (
                    <div key={i} className="flex gap-3 mb-2 ml-4">
                        <span className="text-slate-400">•</span>
                        <span>
                            {parts.map((part, pi) =>
                                part.startsWith('**') && part.endsWith('**')
                                    ? <strong key={pi} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>
                                    : part
                            )}
                        </span>
                    </div>
                );
            }

            // Standard line with bold parsing
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-2">
                    {parts.map((part, pi) =>
                        part.startsWith('**') && part.endsWith('**')
                            ? <strong key={pi} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>
                            : part
                    )}
                </p>
            );
        });
    };

    return (
        <div className="bg-[#fffdf5] dark:bg-[#1c1910] border border-yellow-100 dark:border-yellow-900/30 rounded-2xl shadow-xl overflow-hidden font-serif min-h-[600px] flex flex-col">
            <div className="flex flex-1 border-b border-yellow-200 dark:border-yellow-900/50">
                {/* Cues Column */}
                <div className="w-1/3 border-r border-red-200/50 dark:border-red-900/30 p-8 pt-10">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 dark:text-red-600 mb-6 border-b border-red-100 dark:border-red-900/20 pb-1">Cues / Questions</h4>
                    <div className="text-slate-700 dark:text-slate-300 text-sm space-y-4 italic">
                        {renderMarkdown(cues)}
                    </div>
                </div>
                {/* Notes Column */}
                <div className="w-2/3 p-10 pt-10 relative">
                    {/* Paper lines decoration */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 2rem' }}></div>

                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 dark:text-blue-600 mb-6 border-b border-blue-50 dark:border-blue-900/20 pb-1">Primary Notes</h4>
                    <div className="text-lg text-slate-800 dark:text-slate-100 space-y-4 leading-[2rem]">
                        {renderMarkdown(notes)}
                    </div>
                </div>
            </div>
            {/* Summary Row */}
            {summary && (
                <div className="p-8 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-4 border-b border-amber-200 dark:border-amber-900/30 pb-1">Summary</h4>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        {renderMarkdown(summary)}
                    </div>
                </div>
            )}
        </div>
    );
};

const MindMapModal: React.FC<{ chart: string; onClose: () => void }> = ({ chart, onClose }) => {
    const [zoom, setZoom] = useState(1);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <header className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">account_tree</span>
                        Interactive Mindmap
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
                            <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all">
                                <span className="material-symbols-outlined">zoom_out</span>
                            </button>
                            <span className="px-3 py-1.5 text-xs font-mono font-bold w-16 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(prev => Math.min(3, prev + 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all">
                                <span className="material-symbols-outlined">zoom_in</span>
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-10 cursor-grab active:cursor-grabbing custom-scrollbar">
                    <div className="min-w-max min-h-max flex items-center justify-center transition-transform duration-200 origin-center"
                        style={{ transform: `scale(${zoom})` }}>
                        <MermaidChart chart={chart} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Notes: React.FC = () => {
    const { publish, messages } = useMqtt();
    const [recording, setRecording] = useState(false);
    const [noteStatus, setNoteStatus] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<NoteSession | null>(null);
    const [recentList, setRecentList] = useState<NoteSession[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'cornell' | 'spaced'>('summary');
    const [isMindMapOpen, setIsMindMapOpen] = useState(false);

    // Quiz State
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    // Parse MQTT Messages
    useEffect(() => {
        // Note Status Updates
        if (messages['/note/status']) {
            try {
                const data = JSON.parse(messages['/note/status']);
                setNoteStatus(data);
                setRecording(data.status === 'RECORDING');
            } catch (e) {
                console.error('Failed to parse note status:', e);
            }
        }

        // Note Result (v2.0: INLINE CONTENT!)
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
                    // v2.0: Artifacts are INLINE, not file paths!
                    const newSession: NoteSession = {
                        id: data.session_id,
                        timestamp: data.timestamp,
                        duration_minutes: data.duration_minutes || 0,
                        preview_text: data.preview_text || '',
                        master_guide: data.artifacts?.master_guide || null,
                        flashcards: Array.isArray(data.artifacts?.flashcards) ? data.artifacts.flashcards : null,
                        quiz: Array.isArray(data.artifacts?.quiz) ? data.artifacts.quiz : null,
                        mindmap: typeof data.artifacts?.mindmap === 'string' ? data.artifacts.mindmap : null,
                        cornell_notes: typeof data.artifacts?.cornell_notes === 'string' ? data.artifacts.cornell_notes : null,
                        spaced_repetition: Array.isArray(data.artifacts?.spaced_repetition) ? data.artifacts.spaced_repetition : null,
                        citation_index: Array.isArray(data.artifacts?.citation_index) ? data.artifacts.citation_index : null,
                        stats: data.stats
                    };

                    setNoteStatus({ status: 'COMPLETE', progress: 100 });
                    setRecording(false);

                    // Prevent duplicates
                    setRecentList(prev => {
                        if (prev.some(s => s.id === newSession.id)) return prev;
                        return [newSession, ...prev];
                    });

                    // Auto-select
                    setSelectedSession(newSession);
                    setActiveTab('summary');
                    setQuizAnswers({});
                    setShowResults(false);
                }
            } catch (e) {
                console.error('Failed to parse note result:', e);
            }
        }
    }, [messages]);

    const toggleRecording = () => {
        if (isProcessing) return;
        publish('/note/1', !recording ? 'NOTEON' : 'NOTEOFF');
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

    // Quiz Handlers
    const handleQuizAnswer = (qIndex: number, answer: string) => {
        setQuizAnswers(prev => ({ ...prev, [qIndex]: answer }));
    };

    const calculateScore = () => {
        if (!selectedSession?.quiz) return 0;
        let correct = 0;
        selectedSession.quiz.forEach((q, i) => {
            if (quizAnswers[i] === q.answer) correct++;
        });
        return correct;
    };

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
                {/* Left Sidebar */}
                <aside className="w-80 bg-white dark:bg-[#15232b] border-r border-pink-100 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden">
                    <div className="p-6 pb-4 border-b border-pink-50 dark:border-slate-800">
                        {/* Recording Button */}
                        <button
                            onClick={toggleRecording}
                            disabled={isProcessing}
                            className={`w-full relative group overflow-hidden rounded-full transition-all duration-300 transform active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 py-6
                                ${isProcessing
                                    ? 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 cursor-not-allowed opacity-80'
                                    : recording
                                        ? 'bg-white border-2 border-red-100'
                                        : 'bg-gradient-to-br from-primary to-pink-600 dark:from-primary dark:to-purple-600 text-white hover:shadow-primary/30'
                                }`}
                        >
                            {recording && <span className="absolute inset-0 bg-red-500/10 animate-pulse-ring"></span>}
                            {!recording && !isProcessing && <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000"></div>}

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
                                <span className={`block font-bold text-lg ${isProcessing ? 'text-slate-500' : recording ? 'text-red-500' : 'text-white'}`}>
                                    {isProcessing ? 'Processing Note...' : recording ? 'Stop Recording' : 'Start Recording'}
                                </span>
                            </div>
                        </button>

                        {/* Processing Status */}
                        {isProcessing && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex flex-col gap-2 animate-in slide-in-from-top-2">
                                <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-300">
                                    <span className="animate-pulse">{statusDisplay.text}</span>
                                    <span>{statusDisplay.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300 relative overflow-hidden" style={{ width: `${statusDisplay.progress}%` }}>
                                        <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-400 leading-tight">{statusDisplay.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        <button
                            onClick={() => publish('/note/1', 'GET_SUMMARIZE')}
                            className="w-full mb-4 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 magnetic-hover"
                        >
                            <span className="material-symbols-outlined text-base">history</span>
                            Retrieve Last Note
                        </button>

                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Recordings</h3>
                        <div className="flex flex-col gap-2">
                            {recentList.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No recordings yet.</p>
                            ) : (
                                recentList.map((session, i) => (
                                    <div
                                        key={session.id}
                                        onClick={() => {
                                            setSelectedSession(session);
                                            setActiveTab('summary');
                                            setQuizAnswers({});
                                            setShowResults(false);
                                        }}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col gap-1 group animate-fade-up stagger-${(i % 5) + 1}
                                            ${selectedSession?.id === session.id
                                                ? 'glass-premium border-pink-200 dark:bg-pink-900/20 dark:border-pink-800'
                                                : 'bg-white dark:bg-slate-800/50 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02]'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold text-sm ${selectedSession?.id === session.id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {new Date(session.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="text-[10px] text-slate-400 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded-md">{session.duration_minutes} mins</span>
                                        </div>
                                        <span className="text-xs text-slate-400 truncate">{session.preview_text?.slice(0, 50)}...</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 overflow-y-auto p-6 md:p-10 relative">
                    {selectedSession ? (
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Summary</span>
                                <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-1 animate-gradient bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-[length:200%_auto]">
                                    {new Date(selectedSession.timestamp).toLocaleString()}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 mt-2">{selectedSession.preview_text}</p>
                            </div>

                            {/* Tab Navigation */}
                            <div className="glass-premium rounded-3xl border border-pink-100 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="flex overflow-x-auto border-b border-pink-50 dark:border-slate-700 hide-scrollbar">
                                    <button onClick={() => setActiveTab('summary')}
                                        className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                        📋 Summary
                                    </button>
                                    {selectedSession.flashcards && selectedSession.flashcards.length > 0 && (
                                        <button onClick={() => setActiveTab('flashcards')}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'flashcards' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                            🃏 Flashcards ({selectedSession.flashcards.length})
                                        </button>
                                    )}
                                    {selectedSession.quiz && selectedSession.quiz.length > 0 && (
                                        <button onClick={() => setActiveTab('quiz')}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'quiz' ? 'border-green-500 text-green-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                            ❓ Quiz ({selectedSession.quiz.length})
                                        </button>
                                    )}
                                    {selectedSession.mindmap && (
                                        <button onClick={() => setActiveTab('mindmap')}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'mindmap' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                            🗺️ Mindmap
                                        </button>
                                    )}
                                    {selectedSession.cornell_notes && (
                                        <button onClick={() => setActiveTab('cornell')}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'cornell' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                            📓 Cornell
                                        </button>
                                    )}
                                    {selectedSession.spaced_repetition && selectedSession.spaced_repetition.length > 0 && (
                                        <button onClick={() => setActiveTab('spaced')}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'spaced' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                            🧠 Recall
                                        </button>
                                    )}
                                </div>

                                {/* Tab Content */}
                                <div className="p-6 md:p-8 min-h-[400px]">
                                    {/* SUMMARY TAB */}
                                    {activeTab === 'summary' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {selectedSession.master_guide ? (
                                                <SummaryViewer text={selectedSession.master_guide} />
                                            ) : (
                                                <div>
                                                    <p className="text-lg italic text-slate-500 mb-8 border-l-4 border-pink-200 pl-4">{selectedSession.preview_text}</p>
                                                    {selectedSession.stats && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-950/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm group hover:-translate-y-1 transition-all">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className="material-symbols-outlined text-amber-500 text-3xl">style</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/50">Smart Assets</span>
                                                                </div>
                                                                <span className="text-sm text-amber-700 dark:text-amber-400 font-bold">Knowledge Cards</span>
                                                                <p className="text-4xl font-black text-amber-500 mt-1">{selectedSession.flashcards?.length || 0}</p>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-950/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm group hover:-translate-y-1 transition-all">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className="material-symbols-outlined text-purple-500 text-3xl">psychology</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600/50">AI Extraction</span>
                                                                </div>
                                                                <span className="text-sm text-purple-700 dark:text-purple-400 font-bold">Active Agents</span>
                                                                <p className="text-4xl font-black text-purple-500 mt-1">{selectedSession.stats.agents_successful || 4}</p>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-950/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-900/30 shadow-sm group hover:-translate-y-1 transition-all">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className="material-symbols-outlined text-teal-500 text-3xl">timer</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600/50">Efficiency</span>
                                                                </div>
                                                                <span className="text-sm text-teal-700 dark:text-teal-400 font-bold">Session Time</span>
                                                                <p className="text-4xl font-black text-teal-500 mt-1">{selectedSession.duration_minutes}m</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FLASHCARDS TAB */}
                                    {activeTab === 'flashcards' && selectedSession.flashcards && (
                                        <div className="flex justify-center">
                                            <FlashcardDeck cards={selectedSession.flashcards} />
                                        </div>
                                    )}

                                    {/* QUIZ TAB */}
                                    {activeTab === 'quiz' && selectedSession.quiz && (
                                        <div className="space-y-6">
                                            {selectedSession.quiz.map((q, i) => (
                                                <div key={i} className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl">
                                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-3">
                                                        <span className="size-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                                                        {q.question}
                                                    </h4>
                                                    <div className="space-y-2 pl-11">
                                                        {q.options?.map((opt: string, idx: number) => {
                                                            const isSelected = quizAnswers[i] === opt;
                                                            const isCorrect = opt === q.answer;
                                                            const showCorrect = showResults && isCorrect;
                                                            const showWrong = showResults && isSelected && !isCorrect;

                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => !showResults && handleQuizAnswer(i, opt)}
                                                                    className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${showCorrect ? 'bg-green-100 border-green-300 text-green-700' :
                                                                        showWrong ? 'bg-red-100 border-red-300 text-red-700' :
                                                                            isSelected ? 'bg-primary/10 border-primary text-primary' :
                                                                                'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary'
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}

                                            {!showResults ? (
                                                <button
                                                    onClick={() => setShowResults(true)}
                                                    className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                                                >
                                                    Submit Quiz
                                                </button>
                                            ) : (
                                                <div className="text-center p-6 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl text-white">
                                                    <p className="text-lg font-bold">Your Score</p>
                                                    <p className="text-5xl font-black">{calculateScore()}/{selectedSession.quiz.length}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FIND ME: MINDMAP TAB */}
                                    {activeTab === 'mindmap' && selectedSession.mindmap && (
                                        <div className="animate-in zoom-in-95 duration-500">
                                            <div className="relative group overflow-hidden bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 min-h-[500px] flex flex-col items-center justify-center transition-all hover:border-blue-500/50">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                                                <MermaidChart chart={selectedSession.mindmap} />

                                                {/* Overlay Trigger */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => setIsMindMapOpen(true)}
                                                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-500/50 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined">zoom_in</span>
                                                        View Fullscreen & Zoom
                                                    </button>
                                                </div>
                                            </div>

                                            {isMindMapOpen && (
                                                <MindMapModal
                                                    chart={selectedSession.mindmap}
                                                    onClose={() => setIsMindMapOpen(false)}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* CORNELL NOTES TAB */}
                                    {activeTab === 'cornell' && selectedSession.cornell_notes && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <CornellViewer text={selectedSession.cornell_notes} />
                                        </div>
                                    )}

                                    {/* SPACED REPETITION TAB (Recall) */}
                                    {activeTab === 'spaced' && selectedSession.spaced_repetition && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {Array.isArray(selectedSession.spaced_repetition) ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* If it's the specific array format user provided */}
                                                    {selectedSession.spaced_repetition.map((card: any, i: number) => (
                                                        <div key={i} className="group relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
                                                            <div className="flex justify-between items-start mb-6">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${card.difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                                    card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                                                    }`}>
                                                                    {card.difficulty || 'General'}
                                                                </span>
                                                                <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-sm text-slate-400">psychology</span>
                                                                </div>
                                                            </div>

                                                            <h4 className="font-black text-slate-900 dark:text-white mb-4 pr-4 leading-tight">{card.front}</h4>

                                                            <div className="text-sm text-slate-600 dark:text-slate-300 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2 block">AI Answer</span>
                                                                {card.back}
                                                            </div>

                                                            {/* Tags */}
                                                            {card.tags && (
                                                                <div className="flex flex-wrap gap-1.5 mt-6">
                                                                    {card.tags.map((tag: string, tidx: number) => (
                                                                        <span key={tidx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-full border border-slate-100 dark:border-slate-800">#{tag}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-xl overflow-auto">
                                                    <pre className="text-xs font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                                                        {JSON.stringify(selectedSession.spaced_repetition, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
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