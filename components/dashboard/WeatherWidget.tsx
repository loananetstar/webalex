import React, { useMemo } from 'react';

interface WeatherWidgetProps {
    weather: {
        location: string;
        condition: string;
        temp_c: number | string;
        icon: string;
    } | undefined;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
    // Dynamic background gradient based on weather condition
    const getWeatherGradient = useMemo(() => {
        const condition = weather?.condition?.toLowerCase() || '';
        if (condition.includes('sun') || condition.includes('clear')) {
            return 'from-amber-100/60 to-orange-100/60 dark:from-amber-900/20 dark:to-orange-900/20';
        }
        if (condition.includes('cloud')) {
            return 'from-slate-100/60 to-blue-100/60 dark:from-slate-800/30 dark:to-blue-900/20';
        }
        if (condition.includes('rain') || condition.includes('drizzle')) {
            return 'from-blue-100/60 to-indigo-100/60 dark:from-blue-900/20 dark:to-indigo-900/20';
        }
        if (condition.includes('storm') || condition.includes('thunder')) {
            return 'from-purple-100/60 to-slate-200/60 dark:from-purple-900/20 dark:to-slate-800/30';
        }
        return 'from-violet-100/50 to-purple-100/50 dark:from-violet-900/10 dark:to-purple-900/10';
    }, [weather?.condition]);

    // Animated weather icon with effects
    const renderWeatherEffect = () => {
        const condition = weather?.condition?.toLowerCase() || '';

        // Rain drops
        if (condition.includes('rain') || condition.includes('drizzle')) {
            return (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-0.5 h-3 bg-gradient-to-b from-blue-400 to-transparent rounded-full animate-[fall_1s_linear_infinite]"
                            style={{
                                left: `${20 + i * 15}%`,
                                animationDelay: `${i * 0.2}s`,
                                top: '-10px',
                            }}
                        />
                    ))}
                </div>
            );
        }

        // Sun rays
        if (condition.includes('sun') || condition.includes('clear')) {
            return (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="size-12 rounded-full bg-amber-300/30 animate-pulse-ring"></div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="relative bg-white/60 dark:bg-card-dark/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 rounded-2xl shadow-sm overflow-hidden group magnetic-hover animate-fade-up stagger-3">
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getWeatherGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

            {/* Weather Effect Animation */}
            {renderWeatherEffect()}

            {/* Content */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <span className="text-violet-900 dark:text-violet-100 font-bold text-lg">
                        {weather?.location || '-'}
                    </span>
                    <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">
                        {weather?.condition || 'Loading...'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Animated Temperature */}
                    <span className="text-3xl font-extrabold text-violet-900 dark:text-violet-100 tabular-nums">
                        {weather?.temp_c || '--'}°
                    </span>
                    {/* Floating Icon */}
                    <span className={`material-symbols-outlined text-violet-500 text-3xl animate-float`}>
                        {weather?.icon || 'cloud'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Add fall animation for rain
const style = document.createElement('style');
style.textContent = `
@keyframes fall {
    0% { transform: translateY(-10px); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(60px); opacity: 0; }
}
`;
document.head.appendChild(style);

export default WeatherWidget;
