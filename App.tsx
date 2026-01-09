import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Memory from './pages/Memory';
import Integrations from './pages/Integrations';
import Personalization from './pages/Personalization';
import { MqttProvider } from './context/MqttContext';

// Layout for the main application (Sidebar + Content)
const AppLayout: React.FC = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-soft-gradient dark:bg-background-dark relative">
            {/* Sidebar with mobile state props */}
            <Sidebar
                activePath={location.pathname}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative w-full scroll-smooth">
                {/* 
                    Pass the toggle function to all child routes via Outlet context.
                    This allows Dashboard, Notes, etc. to trigger the menu.
                */}
                <Outlet context={{ toggleSidebar: () => setIsMobileMenuOpen(!isMobileMenuOpen) }} />
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <MqttProvider>
            <HashRouter>
                <Routes>
                    {/* Public Landing Page at Root */}
                    <Route path="/" element={<Landing />} />

                    {/* Protected App Routes */}
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/memory" element={<Memory />} />
                        <Route path="/integrations" element={<Integrations />} />
                        <Route path="/personalization" element={<Personalization />} />
                        <Route path="/settings" element={<div className="p-10 text-center"><h1 className="text-2xl font-bold">Settings Placeholder</h1></div>} />
                    </Route>
                </Routes>
            </HashRouter>
        </MqttProvider>
    );
};

export default App;