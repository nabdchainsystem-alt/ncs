import React from 'react';
import { LifeBuoy } from 'lucide-react';

const ITPage: React.FC = () => {
    return (
        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-in fade-in duration-500 bg-gray-50/50">
            <div className="mb-6 bg-white p-8 rounded-full shadow-sm border border-gray-100 text-clickup-purple">
                <LifeBuoy size={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Business Support / IT</h3>
            <p className="text-gray-500 max-w-md text-center">This module is currently being built.</p>
        </div>
    );
};

export default ITPage;
