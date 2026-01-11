import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardDeckProps {
    cards: Flashcard[];
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) return <div className="text-slate-400">No flashcards generated.</div>;

    const currentCard = cards[currentIndex];

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 200);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto perspective-1000">
            {/* Card Card */}
            <div
                className="relative w-full aspect-[3/2] cursor-pointer group perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full relative preserve-3d transition-all duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Question</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white leading-relaxed">{currentCard.front}</p>
                        <span className="absolute bottom-6 text-xs text-slate-400">Click to flip</span>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border-2 border-amber-200 dark:border-amber-900/50 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">Answer</span>
                        <p className="text-lg font-medium text-slate-700 dark:text-amber-100 leading-relaxed">{currentCard.back}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={prevCard}
                    className="size-12 rounded-full bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-white transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {currentIndex + 1} / {cards.length}
                </span>
                <button
                    onClick={nextCard}
                    className="size-12 rounded-full bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-white transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default FlashcardDeck;
