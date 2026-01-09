import React from 'react';

const Personalization: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col overflow-y-auto w-full custom-scrollbar">
            <div className="w-full flex justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col max-w-[1024px] w-full gap-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-pink-200 dark:border-pink-900/30">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-text-main-light dark:text-text-main-dark text-4xl sm:text-5xl font-extrabold tracking-tight">Identity Settings</h1>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium opacity-80">Manage Davin's account and Alex's persona.</p>
                        </div>
                        <button className="group flex items-center justify-center gap-2 h-12 px-8 bg-gradient-pink hover:opacity-90 active:scale-95 text-white text-base font-bold rounded-full transition-all shadow-lg shadow-pink-300/50 dark:shadow-none transform hover:scale-105">
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            <span>Save Changes</span>
                        </button>
                    </header>
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                                <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
                            </div>
                            <h2 className="text-text-main-light dark:text-text-main-dark text-2xl font-bold">Voice Character</h2>
                        </div>
                        <div className="w-full overflow-hidden">
                            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory">
                                <div className="snap-start shrink-0 flex flex-col w-72 bg-white dark:bg-card-dark rounded-2xl p-6 shadow-xl shadow-pink-200/50 dark:shadow-none border-2 border-primary ring-4 ring-pink-400/20 transition-all hover:-translate-y-1 relative group cursor-pointer">
                                    <div className="absolute top-4 right-4 text-primary">
                                        <span className="material-symbols-outlined fill-1 text-2xl">check_circle</span>
                                    </div>
                                    <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 via-pink-100 to-white dark:from-pink-900 dark:to-slate-800 flex items-center justify-center shadow-inner border-4 border-white dark:border-card-dark">
                                        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDR8AH3H2B6cavDYhdZMWqHU1j0J96aOF__OjtqA6sPNYeADLIp4Gds1MDFW4ehpHgfC1J3pCt0JVJKndsARQoMFlFkGzetTE6DUWzfKg-Vayfm51LMdREUqH496OrNUCHwKdu8PtWTrJoO6eVGlP4AkYdQXBKsZh86vcceC8n_ZDoVGt1vHMN48_82tZEVFlzKYAjaw23hM_2Rh5mOQ9fmvj0AyWxfoSbOrpxiA-9dIPc4fMFSMAj2cqZL3n1eCTq3OUSM4W23o8o')"}}></div>
                                    </div>
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Alex</h3>
                                        <p className="text-sm font-bold text-primary bg-pink-50 dark:bg-pink-900/30 py-1 px-3 rounded-full inline-block mt-1">Helpful & Smart</p>
                                    </div>
                                    <button className="mt-auto w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-pink-200 dark:shadow-none">
                                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                        Listen Sample
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <div className="border-t border-pink-100 dark:border-slate-800 pt-8 mt-4">
                        <div className="flex flex-col gap-4 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined text-2xl">warning</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                        Deleting your account will remove all memory streams, notes, and connected services integration for user <strong>Davin</strong>. This action cannot be undone.
                                    </p>
                                    <button 
                                        onClick={() => alert('Request sent to admin to delete account: Davin')}
                                        className="px-5 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">delete_forever</span>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Personalization;