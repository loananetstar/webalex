import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#ec4899', // pink-500
        secondaryColor: '#a855f7', // purple-500
        tertiaryColor: '#fce7f3', // pink-100
        primaryTextColor: '#831843', // pink-900
        lineColor: '#db2777', // pink-600
        fontFamily: 'Inter, sans-serif'
    }
});

interface MermaidChartProps {
    chart: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Need unique ID for multiple charts
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            containerRef.current.innerHTML = ''; // Clear previous

            mermaid.render(id, chart).then((result) => {
                if (containerRef.current) {
                    containerRef.current.innerHTML = result.svg;
                }
            }).catch(e => {
                console.error("Mermaid Render Error", e);
                if (containerRef.current) containerRef.current.innerHTML = `<div class="text-red-500 text-sm">Failed to render chart: ${e.message}</div>`;
            });
        }
    }, [chart]);

    return (
        <div ref={containerRef} className="w-full flex justify-center py-4 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800" />
    );
};

export default MermaidChart;
