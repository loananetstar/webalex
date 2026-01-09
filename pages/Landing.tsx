import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import RobotModel from '../components/RobotModel';

const RotatingText = () => {
    const phrases = [
        "Your Personal Adaptive Assistant",
        "An Assistant That Adapts",
        "Built Around You",
        "Personal Intelligence, Made Simple",
        "Adaptive by Design",
        "Your AI, Your Rhythm",
        "Designed to Learn You",
        "Intelligence That Fits You",
        "A Smarter Way to Assist",
        "Always Listening. Always Adapting"
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-8 overflow-hidden relative">
            <p key={index} className="text-pink-600 dark:text-pink-300 font-medium text-lg md:text-xl animate-in fade-in slide-in-from-bottom-2 duration-500 absolute w-full text-center md:text-left">
                {phrases[index]}
            </p>
        </div>
    );
};

const Landing: React.FC = () => {
    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-[#1a0f14] dark:via-[#2d1b22] dark:to-[#1a0f14]">

            {/* FULLSCREEN 3D CANVAS (Background Layer) */}
            {/* This allows mouse tracking across the entire screen */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows camera={{ position: [0, 0, 7], fov: 45 }} gl={{ alpha: true }}>
                    <ambientLight intensity={0.7} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    <Environment preset="city" />

                    {/* Robot Positioned to Right Side */}
                    {/* Position shifted further right (+0.3 -> 2.4) as requested */}
                    <RobotModel scale={[1.0, 1.0, 1.0]} position={[2.4, -0.6, 0]} rotation={[0, -0.2, 0]} />

                    <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} />
                </Canvas>
            </div>

            {/* Background Typography */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-50">
                <span className="text-[20vw] font-black text-pink-900/10 dark:text-pink-500/10 whitespace-nowrap rotate-[-15deg] blur-sm">
                    ALEX
                </span>
            </div>

            {/* Main Content Grid (Overlay) */}
            {/* pointer-events-none on container so clicks pass to Canvas if needed (though OrbitControls captures them). 
                We usually want controls to work on Canvas but buttons to work on Overlay.
                pointer-events-auto re-enables text selection and button clicks.
            */}
            <div className="relative z-10 flex flex-col md:flex-row h-full max-w-7xl mx-auto w-full p-6 md:p-12 items-center pointer-events-none">

                {/* Left Side: Text & CTA */}
                <div className="flex-1 flex flex-col gap-6 md:gap-8 text-center md:text-left items-center md:items-start pt-10 md:pt-0 pointer-events-auto">
                    <div className="flex flex-col gap-2 relative">
                        <div className="hidden md:block absolute -left-12 top-0 w-1 h-32 bg-gradient-to-b from-primary to-transparent rounded-full"></div>
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-pink-600 dark:from-pink-400 dark:via-purple-400 dark:to-white leading-tight filter drop-shadow-sm">
                            ALEX,<br />
                            <span className="text-3xl md:text-5xl font-bold text-slate-800 dark:text-slate-200">The First Truly Personal AI</span>
                        </h1>
                        <RotatingText />
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-lg leading-relaxed">
                        Experiences crafted for you. Alex learns your habits, manages your day, and adapts to your life's rhythm seamlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                        <Link to="/dashboard" className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-[0_10px_40px_-10px_rgba(236,72,153,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(236,72,153,0.6)] hover:-translate-y-1 transition-all overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Link>
                        <button className="px-8 py-4 bg-white dark:bg-white/5 text-slate-700 dark:text-white rounded-2xl font-bold text-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">play_circle</span> Watch Demo
                        </button>
                    </div>

                    {/* Floating Context Labels */}
                    <div className="flex gap-4 mt-8 opacity-80 overflow-x-auto w-full justify-center md:justify-start pb-2">
                        {['Smart', 'Secure', 'Adaptive', 'Personal'].map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 border border-pink-100 dark:border-white/10 text-xs font-bold text-pink-900 dark:text-pink-200 uppercase tracking-wider backdrop-blur-sm whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right Side: Spacer for Robot */}
                <div className="flex-1 w-full h-[50vh] md:h-full relative pointer-events-none">
                    {/* Robot is in the background Canvas now, this div just reserves space if needed for layout, 
                         or can be empty to let the robot show through clearly.
                     */}
                </div>
            </div>
        </div>
    );
};

export default Landing;