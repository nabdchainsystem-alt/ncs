import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Terminal, Check } from 'lucide-react';

interface PreMainAppPageProps {
    onSelectApp: (app: 'main', savePreference: boolean) => void;
}

const PreMainAppPage: React.FC<PreMainAppPageProps> = ({ onSelectApp }) => {
    const [savePreference, setSavePreference] = useState(false);

    const handleSelect = () => {
        setTimeout(() => {
            onSelectApp('main', savePreference);
        }, 300);
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#1a1a1a] relative overflow-hidden font-sans">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <div className="flex items-center justify-center w-full h-[80vh] relative z-10 px-4">
                <motion.div
                    key="main-box"
                    layout
                    onClick={handleSelect}
                    className="relative cursor-pointer overflow-hidden bg-white shadow-2xl z-20 rounded-2xl md:hover:scale-105 transition-transform"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    style={{ width: 300, height: 400 }}
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-black min-w-[300px]">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>

                        <div className="z-10 flex flex-col items-center text-center">
                            <Layout size={64} className="mb-6" />
                            <h2 className="font-bold tracking-tighter mb-4 text-3xl">NABD Main</h2>
                            <p className="text-gray-600 font-light">
                                Enter the comprehensive dashboard.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer / Preference */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12 flex flex-col items-center gap-4 z-20"
            >
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${savePreference ? 'bg-purple-600 border-purple-600' : 'border-gray-600 bg-transparent group-hover:border-gray-400'}`}
                        onClick={() => setSavePreference(!savePreference)}
                    >
                        {savePreference && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-gray-400 group-hover:text-white transition-colors select-none text-sm font-medium tracking-wide">
                        Save App Preference or don't show again
                    </span>
                </label>
                <p className="text-gray-600 text-xs tracking-widest uppercase opacity-60">
                    You can change apps inside settings
                </p>
            </motion.div>

        </div>
    );
};

export default PreMainAppPage;
