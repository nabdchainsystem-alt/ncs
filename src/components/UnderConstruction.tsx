import React from 'react';

interface UnderConstructionProps {
    title: string;
    description?: string; // This corresponds to the subtitle in the header
    message?: string; // This corresponds to the text under "Under Construction"
    features?: string[]; // Keeping this optional but won't display by default if not needed to match strict style
}

export const UnderConstruction: React.FC<UnderConstructionProps> = ({
    title,
    description = "Your new workspace.",
    message = "We are currently building this module to bring you the best experience. Check back soon.",
    features
}) => {

    return (
        <div className="flex flex-col flex-1 overflow-auto bg-stone-50 text-stone-900 font-serif tracking-wide relative animate-in fade-in duration-500">
            {/* Background Texture matching Goals/Overview Page */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="w-full px-8 md:px-16 min-h-screen relative z-10">

                {/* --- Header --- */}
                <header className="py-10 pt-20 pb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <h1 className="text-5xl font-medium tracking-tight text-stone-900 font-serif">{title}</h1>
                        <p className="text-lg text-stone-500 font-serif italic mt-2">{description}</p>
                    </div>

                    {/* Date Display (Decorative) */}
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Today</p>
                        <p className="text-2xl font-serif italic text-stone-800">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </header>

                {/* --- Under Construction Content --- */}
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="p-8 bg-white rounded-full shadow-sm border border-stone-100 mb-8 transform hover:scale-105 transition-transform duration-300">
                        <span className="text-6xl">🚧</span>
                    </div>
                    <h2 className="text-4xl font-serif italic text-stone-900 mb-4">Under Construction</h2>
                    <p className="text-stone-500 max-w-md mx-auto text-lg leading-relaxed">
                        {message}
                    </p>

                    {/* Optional Features List (Hidden by default to match strict request, but available) */}
                    {features && features.length > 0 && (
                        <div className="mt-12 opacity-80">
                            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Coming Soon</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {features.map((feature, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 text-sm font-medium">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
