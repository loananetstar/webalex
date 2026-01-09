import React from 'react';

interface WeatherWidgetProps {
    weather: {
        location: string;
        condition: string;
        temp_c: number | string;
        icon: string;
    } | undefined;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
    return (
        <div className="bg-white/60 dark:bg-card-dark/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-100/50 to-purple-100/50 dark:from-violet-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex flex-col relative z-10">
                <span className="text-violet-900 dark:text-violet-100 font-bold text-lg">{weather?.location || '-'}</span>
                <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">{weather?.condition || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-3 relative z-10">
                <span className="text-3xl font-extrabold text-violet-900 dark:text-violet-100">{weather?.temp_c || '--'}°</span>
                <span className="material-symbols-outlined text-violet-500 text-3xl">{weather?.icon || 'cloud'}</span>
            </div>
        </div>
    );
};

export default WeatherWidget;
