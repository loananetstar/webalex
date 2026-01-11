import React from 'react';
import { Link } from 'react-router-dom';
import { useMqtt } from '../context/MqttContext';

interface SidebarProps {
    activePath: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePath, isOpen = false, onClose }) => {
    const { isConnected } = useMqtt();
    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'edit_note', label: 'Notes', path: '/notes' },
        { icon: 'psychology', label: 'Memory', path: '/memory' },
        { icon: 'extension', label: 'Integrations', path: '/integrations' },
        { icon: 'manage_accounts', label: 'Personalization', path: '/personalization' },
    ];

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-72 flex flex-col h-full flex-shrink-0
                    border-r border-pink-100 bg-sidebar-gradient dark:bg-[#2d1b22] dark:border-pink-900/30 
                    shadow-[4px_0_24px_-12px_rgba(236,72,153,0.1)]
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="flex h-full flex-col justify-between p-6 overflow-y-auto">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 ring-2 ring-primary/30 shadow-md shadow-pink-200" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBUn__IoZk5Ws-Lz4PLHWbjfTz0QeirxeDYNrsToYYudIS60nEN2t3G12gRSBsZLJpkaQd-8KwYtgNFtT-gvizxMQM5VfM9b3Vo18ck86laOUbZskDJ7NeQFsoeefDcNMjZ5Gow_mfnms-xO2Croicw9Rdx5jYU42qMXEuDoxZbNTtffwqNd0AK1N0sFI6H1l3FYNW452B0rrlSqr2qJy9A4aptgSrYwPh0Veybqlw7a85c_sY_Nbd0YBewrTW3nlXa54OY2M5JqjA")' }}></div>
                                <div className="flex flex-col">
                                    <h1 className="text-xl font-bold leading-tight text-pink-950 dark:text-pink-100">Alex</h1>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`size-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        <p className="text-pink-400 dark:text-pink-300 text-xs font-bold tracking-wider uppercase">{isConnected ? 'Online' : 'Offline'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Close button for mobile */}
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/20 text-pink-900 dark:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => {
                                const isActive = activePath === item.path || (item.path === '/dashboard' && activePath === '/');
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all transform magnetic-hover ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-white/60 dark:hover:bg-white/10 text-pink-900/70 dark:text-pink-100/70 hover:text-primary dark:hover:text-pink-200 font-medium'}`}
                                    >
                                        <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                        <p className="text-sm font-bold">{item.label}</p>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link to="/settings" onClick={onClose} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 text-pink-900/70 dark:text-pink-100/70 hover:text-primary dark:hover:text-pink-200 transition-colors font-medium magnetic-hover">
                            <span className="material-symbols-outlined text-[24px]">settings</span>
                            <p className="text-sm">Settings</p>
                        </Link>

                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;