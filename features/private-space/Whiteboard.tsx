import React from 'react';
import { PenTool } from 'lucide-react';

const Whiteboard: React.FC = () => {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center bg-white border-2 border-dashed border-gray-200 rounded-xl m-4">
            <div className="bg-blue-50 p-6 rounded-full text-blue-500 mb-4">
                <PenTool size={48} />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Whiteboard</h2>
            <p className="text-gray-500">Canvas ready for your ideas.</p>
        </div>
    );
};

export default Whiteboard;
