import React from 'react';

export const NexusBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#0f1115]">
            {/* Base Grid - More Visible */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#23262d_1px,transparent_1px),linear-gradient(to_bottom,#23262d_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

            {/* Radial Gradient Overlay for "Glow" - Enhanced */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#1a1d24,transparent)] opacity-60" />

            {/* Subtle Pulse Animation */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(56,189,248,0.03),transparent)] animate-pulse" />
        </div>
    );
};
