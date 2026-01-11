import React, { useState, useEffect } from 'react';
import { useMqtt } from '../context/MqttContext';

const ServiceCard = ({
    icon,
    name,
    connected,
    type,
    onConnect,
    isLoading,
    isExternalLink = false // Prop for WhatsApp
}: {
    icon: string,
    name: string,
    connected: boolean,
    type: string,
    onConnect: () => void,
    isLoading: boolean,
    isExternalLink?: boolean
}) => (
    <div className="group flex flex-col p-6 rounded-2xl bg-white dark:bg-[#1a2c35] border border-pink-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(236,72,153,0.08)] hover:shadow-[0_12px_32px_rgba(236,72,153,0.15)] transition-all duration-300 transform hover:-translate-y-2 h-full justify-between">
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 text-primary dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">
                        {/* Use custom images for well-known brands if needed, but sticking to material symbols for consistency if no svg assets */}
                        <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${connected ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                            <span className={`size-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`}></span> {connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="pt-2">
                <p className="text-slate-500 text-sm">Syncs with Alex</p>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-pink-50 dark:border-slate-700 flex justify-end">
            <button
                onClick={onConnect}
                disabled={isLoading}
                className={`
                    w-full relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2
                    ${isLoading
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : connected
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                            : 'bg-primary text-white hover:bg-primary-dark hover:shadow-md'
                    }
                `}
            >
                {isLoading ? (
                    <>
                        <span className="size-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></span>
                        Waiting...
                    </>
                ) : (
                    connected ? 'Disconnect' : (isExternalLink ? 'Open' : 'Connect')
                )}
            </button>
        </div>
    </div>
);

const Integrations: React.FC = () => {
    const { publish, messages, isConnected } = useMqtt();
    const [loadingService, setLoadingService] = useState<string | null>(null);
    const [connections, setConnections] = useState<Record<string, boolean>>({
        'GOOGLE': false,
        'SPOTIFY': false,
        // WhatsApp doesn't have a backend 'connected' state sent via MQTT yet, assume strictly client-side link for now or if backend sends it.
        // Assuming backend sends 'WHATSAPP' if using waha api, but user said "just bring user to url". Let's track it locally or assume always "ready to connect".
        // Actually, user wants "Connected" state displayed? For "multiple tunnel", likely they share state.
        // For WhatsApp, user creates manual link. It's likely stateless in the backend for now? Or maybe we track connection?
        // Let's assume disconnected unless we get a signal.
    });

    // Parse MQTT messages
    useEffect(() => {
        // Auth response from /user2/0
        const authMsg = messages['/user2/0'];
        if (authMsg) {
            console.log('Auth message:', authMsg);

            // Check if it's an auth URL
            if (authMsg.startsWith('http')) {
                // Auto-open the URL in a new tab
                window.open(authMsg, '_blank');
                // Keep loading state while user completes auth
            }
            // Check for success message
            else if (authMsg.startsWith('SUCCESS:')) {
                const service = authMsg.replace('SUCCESS:', '').trim();
                setConnections(prev => ({ ...prev, [service]: true }));
                setLoadingService(null);
            }
            // Check for error messages
            else if (authMsg.startsWith('ERROR:') || authMsg === 'AUTH_BUSY' || authMsg === 'TIMEOUT' || authMsg.startsWith('UNKNOWN:')) {
                console.error('Auth error:', authMsg);
                alert(`Authentication error: ${authMsg}`);
                setLoadingService(null);
            }
        }

        // Dashboard response for integration status
        if (messages['dashboard/response']) {
            try {
                const data = JSON.parse(messages['dashboard/response']);
                if (data.integrations) {
                    setConnections(data.integrations);
                }
            } catch (e) {
                console.error('Failed to parse dashboard response:', e);
            }
        }
    }, [messages]);

    // Request dashboard data on mount to get connection status
    useEffect(() => {
        if (isConnected) {
            publish('dashboard/request', 'GET');
        }
    }, [isConnected, publish]);

    const handleConnect = (serviceKey: string, command: string) => {
        // WhatsApp Limit: Just open URL
        if (serviceKey === 'WHATSAPP') {
            window.open('https://waha.lumyx.my.id', '_blank');
            return;
        }

        const isGoogleService = ['GMAIL', 'CLASSROOM', 'DRIVE', 'CALENDAR', 'GOOGLE'].includes(serviceKey);
        const actualStateKey = isGoogleService ? 'GOOGLE' : serviceKey; // All Google services share 'GOOGLE' state

        if (connections[actualStateKey]) {
            // Disconnect logic
            setConnections(prev => ({ ...prev, [actualStateKey]: false }));
        } else {
            // Connect: Start auth flow
            setLoadingService(serviceKey); // Show loading spinner on the specific card clicked
            publish('/user1/0', command);

            // Timeout fallback (60s as per protocol guide)
            setTimeout(() => {
                setLoadingService(prev => prev === serviceKey ? null : prev);
            }, 60000);
        }
    };

    // Helper to get loading state for shared Google services
    const isGoogleLoading = (key: string) => {
        if (loadingService === key) return true;
        // If any google service triggered loading, maybe show loading on all? Or just the one clicked.
        // User UX: better to show on the one clicked.
        return false;
    };

    const googleConnected = connections['GOOGLE'] || false;

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar">

            <div className="px-6 md:px-20 lg:px-40 flex flex-1 justify-center py-8">
                <div className="flex flex-col max-w-[1024px] flex-1">
                    <div className="flex flex-wrap justify-between gap-3 p-4 mb-2">
                        <div className="flex min-w-72 flex-col gap-2">
                            <h1 className="text-[#0d171b] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-[-0.033em]">Connected Services</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Manage what Alex can access.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">

                        {/* Google Ecosystem - Distinct entries, distinct commands per Guide Section 2.1 */}
                        <ServiceCard
                            icon="mail"
                            name="Gmail"
                            type="Google"
                            connected={googleConnected}
                            isLoading={isGoogleLoading('GMAIL')}
                            onConnect={() => handleConnect('GMAIL', 'AUTH:GMAIL')}
                        />
                        <ServiceCard
                            icon="school"
                            name="Classroom"
                            type="Google"
                            connected={googleConnected}
                            isLoading={isGoogleLoading('CLASSROOM')}
                            onConnect={() => handleConnect('CLASSROOM', 'AUTH:GCLASSROOM')}
                        />
                        <ServiceCard
                            icon="cloud"
                            name="Drive"
                            type="Google"
                            connected={googleConnected}
                            isLoading={isGoogleLoading('DRIVE')}
                            onConnect={() => handleConnect('DRIVE', 'AUTH:DRIVE')}
                        />
                        <ServiceCard
                            icon="calendar_today"
                            name="Calendar"
                            type="Google"
                            connected={googleConnected}
                            isLoading={isGoogleLoading('CALENDAR')}
                            onConnect={() => handleConnect('CALENDAR', 'AUTH:CALENDAR')}
                        />

                        {/* WhatsApp - Link */}
                        <ServiceCard
                            icon="chat"
                            name="WhatsApp"
                            type="Messaging"
                            connected={false} // Always shows as "Open" / Disconnected visually since we don't track it
                            isLoading={false}
                            isExternalLink={true}
                            onConnect={() => handleConnect('WHATSAPP', '')}
                        />

                        {/* Spotify - Distinct Auth */}
                        <ServiceCard
                            icon="music_note"
                            name="Spotify"
                            type="Music"
                            connected={connections['SPOTIFY']}
                            isLoading={loadingService === 'SPOTIFY'}
                            onConnect={() => handleConnect('SPOTIFY', 'AUTH:SPOTIFY')}
                            isExternalLink={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Integrations;