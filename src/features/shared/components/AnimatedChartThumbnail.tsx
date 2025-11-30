import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedChartThumbnailProps {
    type: string;
    color?: string;
}

const AnimatedChartThumbnail: React.FC<AnimatedChartThumbnailProps & { animate?: boolean }> = ({ type, color = '#3b82f6', animate = true }) => {
    const chartType = type.toLowerCase();

    const containerVariants = {
        hover: { scale: 1.05, transition: { duration: 0.3 } }
    };

    // Static versions for better performance
    if (!animate) {
        if (chartType.includes('bar')) {
            return (
                <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="10" y="20" width="15" height="40" fill={color} opacity={0.4} />
                    <rect x="35" y="10" width="15" height="50" fill={color} opacity={0.7} />
                    <rect x="60" y="30" width="15" height="30" fill={color} opacity={0.5} />
                    <rect x="85" y="15" width="15" height="45" fill={color} opacity={0.9} />
                </svg>
            );
        }
        if (chartType.includes('line') || chartType.includes('area')) {
            return (
                <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M10 50 L30 30 L50 40 L70 15 L90 25" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {chartType.includes('area') && (
                        <path d="M10 50 L30 30 L50 40 L70 15 L90 25 V60 H10 Z" fill={color} opacity={0.2} />
                    )}
                    <circle cx="30" cy="30" r="3" fill={color} />
                    <circle cx="70" cy="15" r="3" fill={color} />
                </svg>
            );
        }
        if (chartType.includes('pie') || chartType.includes('donut')) {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none" />
                    <circle cx="50" cy="50" r="40" stroke={color} strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none"
                        strokeDasharray="251.2" strokeDashoffset="60" strokeLinecap="round" transform="rotate(-90 50 50)" />
                    <circle cx="50" cy="50" r="40" stroke={color} strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none"
                        opacity={0.5} strokeDasharray="251.2" strokeDashoffset="180" strokeLinecap="round" transform="rotate(120 50 50)" />
                </svg>
            );
        }
        if (chartType.includes('gauge')) {
            return (
                <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M10 50 A 40 40 0 0 1 90 50" stroke="#e5e7eb" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M10 50 A 40 40 0 0 1 90 50" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
                        strokeDasharray="125.6" strokeDashoffset="40" />
                    <line x1="50" y1="50" x2="50" y2="20" stroke="#374151" strokeWidth="3" strokeLinecap="round" transform="rotate(45 50 50)" />
                </svg>
            );
        }
        return (
            <svg viewBox="0 0 100 60" className="w-full h-full">
                <rect x="10" y="10" width="80" height="40" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
                <line x1="20" y1="20" x2="80" y2="20" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="30" x2="60" y2="30" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="40" x2="70" y2="40" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (chartType.includes('bar')) {
        return (
            <motion.svg viewBox="0 0 100 60" className="w-full h-full" variants={containerVariants}>
                <motion.rect x="10" y="20" width="15" height="40" fill={color} opacity={0.4}
                    initial={{ height: 0, y: 60 }} animate={{ height: 40, y: 20 }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }} />
                <motion.rect x="35" y="10" width="15" height="50" fill={color} opacity={0.7}
                    initial={{ height: 0, y: 60 }} animate={{ height: 50, y: 10 }} transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.5 }} />
                <motion.rect x="60" y="30" width="15" height="30" fill={color} opacity={0.5}
                    initial={{ height: 0, y: 60 }} animate={{ height: 30, y: 30 }} transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", repeatDelay: 1.2 }} />
                <motion.rect x="85" y="15" width="15" height="45" fill={color} opacity={0.9}
                    initial={{ height: 0, y: 60 }} animate={{ height: 45, y: 15 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.8 }} />
            </motion.svg>
        );
    }

    if (chartType.includes('line') || chartType.includes('area')) {
        return (
            <motion.svg viewBox="0 0 100 60" className="w-full h-full" variants={containerVariants}>
                <motion.path
                    d="M10 50 L30 30 L50 40 L70 15 L90 25"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                />
                {chartType.includes('area') && (
                    <motion.path
                        d="M10 50 L30 30 L50 40 L70 15 L90 25 V60 H10 Z"
                        fill={color}
                        opacity={0.2}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                    />
                )}
                <motion.circle cx="30" cy="30" r="3" fill={color} animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <motion.circle cx="70" cy="15" r="3" fill={color} animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }} />
            </motion.svg>
        );
    }

    if (chartType.includes('pie') || chartType.includes('donut')) {
        return (
            <motion.svg viewBox="0 0 100 100" className="w-full h-full p-2" variants={containerVariants}>
                <motion.circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none" />
                <motion.circle cx="50" cy="50" r="40" stroke={color} strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset="251.2"
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: 60 }}
                    transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
                    transform="rotate(-90 50 50)"
                />
                <motion.circle cx="50" cy="50" r="40" stroke={color} strokeWidth={chartType.includes('donut') ? "20" : "40"} fill="none"
                    opacity={0.5}
                    strokeDasharray="251.2"
                    strokeDashoffset="251.2"
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: 180 }}
                    transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1, delay: 0.2 }}
                    transform="rotate(120 50 50)"
                />
            </motion.svg>
        );
    }

    if (chartType.includes('gauge')) {
        return (
            <motion.svg viewBox="0 0 100 60" className="w-full h-full" variants={containerVariants}>
                <path d="M10 50 A 40 40 0 0 1 90 50" stroke="#e5e7eb" strokeWidth="10" fill="none" strokeLinecap="round" />
                <motion.path d="M10 50 A 40 40 0 0 1 90 50" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset="125.6"
                    animate={{ strokeDashoffset: 40 }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.line x1="50" y1="50" x2="50" y2="20" stroke="#374151" strokeWidth="3" strokeLinecap="round"
                    initial={{ rotate: -90 }}
                    animate={{ rotate: 45 }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                    style={{ originX: "50px", originY: "50px" }}
                />
            </motion.svg>
        );
    }

    // Default / Generic
    return (
        <motion.svg viewBox="0 0 100 60" className="w-full h-full" variants={containerVariants}>
            <motion.rect x="10" y="10" width="80" height="40" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
            <motion.line x1="20" y1="20" x2="80" y2="20" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <motion.line x1="20" y1="30" x2="60" y2="30" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <motion.line x1="20" y1="40" x2="70" y2="40" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        </motion.svg>
    );
};

export default AnimatedChartThumbnail;
