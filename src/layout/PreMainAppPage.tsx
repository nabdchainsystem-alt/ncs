import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Terminal, Check } from 'lucide-react';

interface PreMainAppPageProps {
    onSelectApp: (app: 'main' | 'vision', savePreference: boolean) => void;
}

const PreMainAppPage: React.FC<PreMainAppPageProps> = ({ onSelectApp }) => {
    const [hovered, setHovered] = useState<'main' | 'vision' | null>(null);
    const [selected, setSelected] = useState<'main' | 'vision' | null>(null);
    const [savePreference, setSavePreference] = useState(false);

    const handleSelect = (app: 'main' | 'vision') => {
        setSelected(app);
        setTimeout(() => {
            onSelectApp(app, savePreference);
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#1a1a1a] relative overflow-hidden font-sans">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <div className="flex items-center justify-center gap-8 w-full h-[80vh] relative z-10 px-4">

                {/* NABD Main Box */}
                <AnimatePresence mode='wait'>
                    {(hovered !== 'vision' && selected !== 'vision') && (
                        <motion.div
                            key="main-box"
                            onHoverStart={() => !selected && setHovered('main')}
                            onHoverEnd={() => !selected && setHovered(null)}
                            onClick={() => !selected && handleSelect('main')}
                            className="relative cursor-pointer overflow-hidden bg-white shadow-2xl z-20"
                            initial={{ width: 300, height: 400, borderRadius: 0, opacity: 0, x: -50 }}
                            animate={{
                                width: selected === 'main' ? "100vw" : hovered === 'main' ? "60vw" : 300,
                                height: selected === 'main' ? "100vh" : hovered === 'main' ? "70vh" : 400,
                                borderRadius: selected === 'main' ? "0rem" : hovered === 'main' ? "2rem" : "0rem",
                                opacity: 1,
                                x: selected === 'main' ? 0 : 0,
                                position: selected === 'main' ? 'fixed' : 'relative',
                                left: selected === 'main' ? 0 : 'auto',
                                top: selected === 'main' ? 0 : 'auto',
                                zIndex: selected === 'main' ? 50 : 20,
                            }}
                            exit={{ width: 0, opacity: 0, transition: { duration: 0.3 } }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-black">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>

                                <motion.div
                                    className="z-10 flex flex-col items-center text-center"
                                    animate={{ scale: selected === 'main' ? 1.2 : hovered === 'main' ? 1 : 0.9, opacity: selected === 'main' ? 0 : 1 }}
                                >
                                    <Layout size={hovered === 'main' ? 64 : 48} className="mb-6 transition-all duration-500" />
                                    <h2 className={`font-bold tracking-tighter mb-4 transition-all duration-500 ${hovered === 'main' ? 'text-5xl' : 'text-3xl'}`}>
                                        NABD Main
                                    </h2>

                                    <AnimatePresence>
                                        {hovered === 'main' && !selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ delay: 0.1 }}
                                                className="mt-8 max-w-2xl"
                                            >
                                                <p className="text-gray-600 text-2xl leading-relaxed font-light">
                                                    A comprehensive dashboard experience. <br />
                                                    <span className="font-medium text-black">Side bar</span>, <span className="font-medium text-black">top bar</span>, and <span className="font-medium text-black">content</span> all well organized for maximum productivity.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* NABD Brain & Vision Box */}
                <AnimatePresence mode='wait'>
                    {(hovered !== 'main' && selected !== 'main') && (
                        <motion.div
                            key="vision-box"
                            onHoverStart={() => !selected && setHovered('vision')}
                            onHoverEnd={() => !selected && setHovered(null)}
                            onClick={() => !selected && handleSelect('vision')}
                            className="relative cursor-pointer overflow-hidden border border-purple-500/30 shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)] z-20"
                            initial={{ width: 300, height: 400, borderRadius: 0, opacity: 0, x: 50 }}
                            animate={{
                                width: selected === 'vision' ? "100vw" : hovered === 'vision' ? "60vw" : 300,
                                height: selected === 'vision' ? "100vh" : hovered === 'vision' ? "70vh" : 400,
                                borderRadius: selected === 'vision' ? "0rem" : hovered === 'vision' ? "2rem" : "0rem",
                                opacity: 1,
                                x: selected === 'vision' ? 0 : 0,
                                position: selected === 'vision' ? 'fixed' : 'relative',
                                left: selected === 'vision' ? 0 : 'auto',
                                top: selected === 'vision' ? 0 : 'auto',
                                zIndex: selected === 'vision' ? 50 : 20,
                            }}
                            exit={{ width: 0, opacity: 0, transition: { duration: 0.3 } }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        >
                            {/* Background - Vision Style */}
                            <div className="absolute inset-0 bg-[#0f1115] text-white flex flex-col items-center justify-center p-8">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e520_1px,transparent_1px),linear-gradient(to_bottom,#4f46e520_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#4f46e515_0%,transparent_100%)]"></div>

                                <motion.div
                                    className="z-10 flex flex-col items-center text-center"
                                    animate={{ scale: selected === 'vision' ? 1.2 : hovered === 'vision' ? 1 : 0.9, opacity: selected === 'vision' ? 0 : 1 }}
                                >
                                    <Terminal size={hovered === 'vision' ? 64 : 48} className="mb-6 text-purple-400 transition-all duration-500" />
                                    <h2 className={`font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ${hovered === 'vision' ? 'text-5xl' : 'text-3xl'}`}>
                                        NABD Brain & Vision
                                    </h2>

                                    <AnimatePresence>
                                        {hovered === 'vision' && !selected && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ delay: 0.1 }}
                                                className="mt-8 max-w-2xl"
                                            >
                                                <p className="text-gray-400 text-2xl leading-relaxed font-light">
                                                    Terminal-based power. <br />
                                                    <span className="text-purple-300">Commands</span> easy to use, <span className="text-purple-300">fast to load</span>, and <span className="text-purple-300">better visualization</span>.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer / Preference */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: selected ? 0 : 1, y: selected ? 20 : 0 }}
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
