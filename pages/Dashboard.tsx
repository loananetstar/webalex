import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';
import { motion } from 'framer-motion';
import AgentStatusCard from '../components/dashboard/AgentStatusCard';
import WeatherWidget from '../components/dashboard/WeatherWidget';

// Define the context type provided by App.tsx
interface DashboardContextType {
    toggleSidebar: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-white/60 dark:bg-[#1f1016]/80 backdrop-blur-md px-6 py-4 lg:hidden border-b border-pink-100 dark:border-pink-900/30 flex-shrink-0">
        <div className="flex items-center gap-3">
            <button
                onClick={onMenuClick}
                className="text-pink-900 dark:text-white p-1 rounded-md hover:bg-pink-100/50 dark:hover:bg-white/10 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-bold text-lg text-pink-900 dark:text-pink-50">Alex</span>
        </div>
        <div className="size-8 rounded-full bg-pink-200 overflow-hidden ring-2 ring-primary/30" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9RqysrPXPAa2XZ0VLwoFfOxhHfv8jdqgkSS_XGeRHuZ3dRUkdZbPhtIo9aIBB94kV79sA6Ey_GlhyLdQXSJ6YnbBSQbJdSO2ZNhGDe5ZrDWXRkyZQ2IYTEWNmiyq35Rz7TeDDp_N2UfpH2h7UHvTcjYmXy4ntYHISaFg6GizPxRn6BvK4HSxsKyDLlV2jqJw2tXsB0f6gtZFTStNFWOkmtmdwOtuGXm9l9xef4Dc1pH-9KGjyRditRA3w1dPmxrSm4hWTsvY08nE')", backgroundSize: 'cover' }}></div>
    </header>
);

const Dashboard: React.FC = () => {
    const { publish, isConnected, messages } = useMqtt();
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const [showEvents, setShowEvents] = useState(false);

    // MQTT Heartbeat Data (alex/dashboard/state) - Updated every 5 seconds from backend
    const [heartbeat, setHeartbeat] = useState({
        is_active: false,
        battery_level: 0,
        is_connected: false,
        active_status_message: "Connecting..."
    });

    // Dashboard Data (dashboard/response) - Weather & Integrations
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Parse MQTT messages
    useEffect(() => {
        // Heartbeat from alex/dashboard/state
        if (messages['alex/dashboard/state']) {
            try {
                const data = JSON.parse(messages['alex/dashboard/state']);
                setHeartbeat(data);
            } catch (e) {
                console.error('Failed to parse heartbeat:', e);
            }
        }

        // Dashboard response (weather + integrations)
        if (messages['dashboard/response']) {
            try {
                const data = JSON.parse(messages['dashboard/response']);
                setDashboardData(data);
            } catch (e) {
                console.error('Failed to parse dashboard response:', e);
            }
        }
    }, [messages]);

    // Request dashboard data every 60 seconds (throttled)
    useEffect(() => {
        if (!isConnected) return;

        const fetchData = () => {
            console.log('Fetching dashboard data (weather/integrations)...');
            publish('dashboard/request', 'GET');
        };

        // Initial fetch
        fetchData();

        // Interval fetch (60s)
        const intervalId = setInterval(fetchData, 60000);

        return () => clearInterval(intervalId);
    }, [isConnected, publish]);

    const toggleAgent = () => {
        const newState = !heartbeat.is_active;
        publish('/agent/1', newState ? 'AGENTON' : 'AGENTOFF');
    };

    return (
        <div className="flex flex-col h-full w-full">
            <MobileHeader onMenuClick={toggleSidebar} />
            <motion.div
                className="w-full max-w-[1200px] mx-auto px-6 py-8 md:px-12 md:py-10 flex flex-col gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-pink-950 dark:text-white tracking-tight">Good morning, Davin</h1>
                    <p className="text-pink-800/60 dark:text-pink-200/60 text-lg font-medium">Alex is ready to assist you today. Systems {isConnected ? 'connected' : 'connecting...'}.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                        <AgentStatusCard heartbeat={heartbeat} onToggle={toggleAgent} />
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-4">
                        <div className="relative h-[280px]"> {/* Placeholder to maintain layout */}
                            <div
                                className={`
                                    w-full rounded-2xl bg-white dark:bg-[#2d1b22] border border-pink-100 dark:border-pink-900/30 p-6 flex flex-col relative overflow-hidden group shadow-[0_4px_20px_-2px_rgba(236,72,153,0.1)] transition-all cursor-pointer duration-300 origin-top
                                    ${showEvents
                                        ? 'absolute top-0 left-0 z-50 h-[450px] shadow-2xl ring-4 ring-pink-50 dark:ring-pink-900/20'
                                        : 'h-full hover:-translate-y-1 hover:shadow-lg'
                                    }
                                `}
                                onClick={() => setShowEvents(!showEvents)}
                            >
                                <span className={`material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] text-pink-50/80 dark:text-pink-500/5 transition-transform duration-500 pointer-events-none select-none ${showEvents ? 'opacity-20 translate-y-4' : 'group-hover:scale-105'}`}>calendar_month</span>

                                {/* Header Content */}
                                <div className="relative z-10 flex justify-between items-start flex-shrink-0">
                                    <div>
                                        <h3 className="text-pink-950 dark:text-pink-100 font-bold text-lg mb-1">Up Next</h3>
                                        <div className="inline-block px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-bold uppercase tracking-wider mb-2">Google Cal</div>
                                    </div>
                                    <div className={`size-8 rounded-full bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center transition-transform duration-300 ${showEvents ? 'bg-pink-100 dark:bg-pink-800 rotate-180' : ''}`}>
                                        <span className="material-symbols-outlined text-pink-400 dark:text-pink-300">expand_more</span>
                                    </div>
                                </div>

                                <p className="relative z-10 text-pink-800 dark:text-pink-200 font-medium line-clamp-2 text-lg leading-tight mb-4 flex-shrink-0">Project Review with Team</p>

                                <div className="relative z-10 mt-auto flex-shrink-0">
                                    <p className="text-4xl font-extrabold text-primary dark:text-pink-400 tracking-tight leading-none">10:00 AM</p>
                                    <p className="text-pink-400 dark:text-pink-500 font-bold text-sm mt-1">in 35 minutes</p>
                                </div>

                                {/* Expanded Events List */}
                                <div className={`
                                    relative z-10 mt-6 pt-6 border-t border-pink-50 dark:border-pink-900/20 flex flex-col gap-4 
                                    transition-all duration-300 overflow-y-auto custom-scrollbar
                                    ${showEvents ? 'opacity-100 translate-y-0 flex-1' : 'opacity-0 translate-y-4 hidden h-0'}
                                `}>
                                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#2d1b22] py-1 z-20">Later Today</h4>

                                    <div className="flex gap-3 items-center group/item hover:bg-pink-50/50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <div className="flex flex-col items-center min-w-[3.5rem]">
                                            <span className="text-xs font-bold text-pink-400">1:00 PM</span>
                                        </div>
                                        <div className="w-1 h-8 rounded-full bg-pink-200 dark:bg-pink-800 group-hover/item:bg-pink-300 transition-colors"></div>
                                        <div>
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Lunch with Sarah</p>
                                            <p className="text-xs text-pink-500">Sushi Tei</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-center group/item hover:bg-pink-50/50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <div className="flex flex-col items-center min-w-[3.5rem]">
                                            <span className="text-xs font-bold text-pink-400">3:30 PM</span>
                                        </div>
                                        <div className="w-1 h-8 rounded-full bg-purple-200 dark:bg-purple-900/50 group-hover/item:bg-purple-300 transition-colors"></div>
                                        <div>
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Design Sync</p>
                                            <p className="text-xs text-pink-500">Google Meet</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-center group/item hover:bg-pink-50/50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <div className="flex flex-col items-center min-w-[3.5rem]">
                                            <span className="text-xs font-bold text-pink-400">5:00 PM</span>
                                        </div>
                                        <div className="w-1 h-8 rounded-full bg-teal-200 dark:bg-teal-900/50 group-hover/item:bg-teal-300 transition-colors"></div>
                                        <div>
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Gym Session</p>
                                            <p className="text-xs text-pink-500">Fitness First</p>
                                        </div>
                                    </div>

                                    {/* Extra item for testing scroll */}
                                    <div className="flex gap-3 items-center group/item hover:bg-pink-50/50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <div className="flex flex-col items-center min-w-[3.5rem]">
                                            <span className="text-xs font-bold text-pink-400">8:00 PM</span>
                                        </div>
                                        <div className="w-1 h-8 rounded-full bg-blue-200 dark:bg-blue-900/50 group-hover/item:bg-blue-300 transition-colors"></div>
                                        <div>
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Reading Time</p>
                                            <p className="text-xs text-pink-500">Kindle</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <WeatherWidget weather={dashboardData?.weather} />
                    </motion.div>
                </div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-4 lg:col-span-1 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-pink-950 dark:text-white px-1">Quick Actions</h3>
                        <Link to="/notes" className="w-full text-left bg-white dark:bg-[#2d1b22] p-4 rounded-xl shadow-[0_2px_12px_-2px_rgba(236,72,153,0.1)] border border-pink-50 dark:border-pink-900/30 hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-md transition-all group flex items-center gap-3">
                            <div className="bg-orange-50 dark:bg-orange-900/20 size-10 rounded-lg flex items-center justify-center text-orange-500 dark:text-orange-300 group-hover:scale-110 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-all">
                                <span className="material-symbols-outlined">edit_square</span>
                            </div>
                            <div>
                                <p className="font-bold text-pink-950 dark:text-pink-50 text-sm">New Note</p>
                                <p className="text-xs text-pink-400 dark:text-pink-400">Capture a thought</p>
                            </div>
                        </Link>
                        <Link to="/memory" className="w-full text-left bg-white dark:bg-[#2d1b22] p-4 rounded-xl shadow-[0_2px_12px_-2px_rgba(236,72,153,0.1)] border border-pink-50 dark:border-pink-900/30 hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-md transition-all group flex items-center gap-3">
                            <div className="bg-teal-50 dark:bg-teal-900/20 size-10 rounded-lg flex items-center justify-center text-teal-500 dark:text-teal-300 group-hover:scale-110 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40 transition-all">
                                <span className="material-symbols-outlined">history</span>
                            </div>
                            <div>
                                <p className="font-bold text-pink-950 dark:text-pink-50 text-sm">Review Memory</p>
                                <p className="text-xs text-pink-400 dark:text-pink-400">Browse logs</p>
                            </div>
                        </Link>
                    </div>
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-pink-950 dark:text-white">Recent Activity</h3>
                            <a className="text-sm font-bold text-primary hover:text-pink-700 transition-colors bg-white/50 px-3 py-1 rounded-full" href="#">View All</a>
                        </div>
                        <div className="bg-white dark:bg-[#2d1b22] rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(236,72,153,0.1)] border border-pink-100 dark:border-pink-900/30">
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 size-3 rounded-full bg-primary flex-shrink-0 ring-4 ring-pink-50 dark:ring-pink-900/50 group-hover:ring-pink-100 transition-all"></div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Interaction: Morning Briefing</p>
                                            <span className="text-xs text-pink-400 font-medium">10m ago</span>
                                        </div>
                                        <p className="text-sm text-pink-600 dark:text-pink-300/80 leading-relaxed">Summarized your calendar events and read top 3 news headlines.</p>
                                    </div>
                                </div>
                                <hr className="border-pink-50 dark:border-pink-900/20" />
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 size-3 rounded-full bg-teal-400 flex-shrink-0 ring-4 ring-teal-50 dark:ring-teal-900/30 group-hover:ring-teal-100 transition-all"></div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">Memory Saved: Pasta Recipe</p>
                                            <span className="text-xs text-pink-400 font-medium">2h ago</span>
                                        </div>
                                        <p className="text-sm text-pink-600 dark:text-pink-300/80 leading-relaxed">Saved "Carbonara with guanciale" to your recipe collection based on voice command.</p>
                                    </div>
                                </div>
                                <hr className="border-pink-50 dark:border-pink-900/20" />
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 size-3 rounded-full bg-purple-400 flex-shrink-0 ring-4 ring-purple-50 dark:ring-purple-900/30 group-hover:ring-purple-100 transition-all"></div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-pink-900 dark:text-pink-100">System Update</p>
                                            <span className="text-xs text-pink-400 font-medium">Yesterday</span>
                                        </div>
                                        <p className="text-sm text-pink-600 dark:text-pink-300/80 leading-relaxed">Alex firmware updated to v2.4. Improved voice recognition latency.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;