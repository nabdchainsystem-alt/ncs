import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface GenerateSystemButtonProps {
    onGenerate: () => void;
}

export const GenerateSystemButton: React.FC<GenerateSystemButtonProps> = ({ onGenerate }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(true);
        // Delay slightly to let the projectile shoot up
        setTimeout(() => {
            onGenerate();
        }, 500);
    };

    return (
        <div className="relative flex items-center justify-center">
            {/* Electric Field / Aura - Visible Blue/Purple Glow */}
            <AnimatePresence>
                {isHovered && !isClicked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.3 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full z-0"
                    />
                )}
            </AnimatePresence>

            {/* Sparks Container - Visible Colors */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        initial={{ opacity: 0, scaleY: 0, rotate: i * 30, y: -20 }}
                        animate={
                            isHovered && !isClicked
                                ? {
                                    opacity: [0, 1, 0],
                                    scaleY: [0.5, 1.2, 0.5],
                                    y: [-25, -35, -25],
                                    x: [0, (Math.random() - 0.5) * 8, 0],
                                    backgroundColor: i % 2 === 0 ? '#22d3ee' : '#a855f7', // Cyan & Purple
                                }
                                : { opacity: 0 }
                        }
                        transition={{
                            duration: 0.2,
                            repeat: Infinity,
                            repeatDelay: Math.random() * 0.3,
                            ease: "linear",
                        }}
                        style={{
                            transformOrigin: "bottom center",
                        }}
                    />
                ))}
            </div>

            {/* Main Button - Smaller Size */}
            <motion.button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
          relative z-10 flex items-center gap-2 px-6 py-3 
          bg-black text-white rounded-full 
          border border-gray-800 hover:border-blue-500/50
          shadow-lg shadow-black/10
          overflow-hidden group
          transition-all duration-300
        `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isClicked ? { scale: 0, opacity: 0, y: -50 } : {}}
                transition={{ duration: 0.4, ease: "backIn" }}
            >
                {/* Electric Border Effect */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-blue-400/30 transition-colors duration-300" />

                {/* Button Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                <div className="relative flex items-center gap-2">
                    <div className="p-1 bg-white/10 rounded-full text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
                        <Zap size={16} className={isHovered ? "animate-pulse" : ""} fill="currentColor" />
                    </div>
                    <span className="text-sm font-bold tracking-wider uppercase font-mono">
                        Generate System
                    </span>
                </div>
            </motion.button>

            {/* Projectile Spark - Visible Blue Bolt */}
            <AnimatePresence>
                {isClicked && (
                    <motion.div
                        className="absolute z-50 w-3 h-8 bg-blue-500 rounded-full shadow-[0_0_40px_rgba(59,130,246,1)]"
                        initial={{ y: 0, scale: 1 }}
                        animate={{
                            y: -window.innerHeight / 2 - 100, // Shoot up off screen
                            scaleY: [1, 3, 0.5],
                            opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 0.5, ease: "easeIn" }}
                    >
                        <div className="absolute inset-0 bg-cyan-300 blur-md scale-150" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
