import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { LongTextEditor } from '../LongTextEditor';

interface LongTextCellProps {
    value: string;
    onChange: (value: string) => void;
    tabIndex?: number;
    darkMode?: boolean;
}

export const LongTextCell: React.FC<LongTextCellProps> = ({ value, onChange, tabIndex, darkMode }) => {
    const [showEditor, setShowEditor] = useState(false);

    return (
        <>
            <div
                className={`w-full h-full relative group cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                onClick={() => setShowEditor(true)}
            >
                <div
                    className={`w-full h-full px-2 py-1.5 text-sm whitespace-nowrap overflow-hidden text-ellipsis focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    tabIndex={tabIndex}
                >
                    {value || <span className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} italic`}>Empty</span>}
                </div>

                {/* Expand icon on hover */}
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Maximize2 size={12} />
                </div>
            </div>

            {showEditor && (
                <LongTextEditor
                    value={value}
                    onChange={onChange}
                    onClose={() => setShowEditor(false)}
                    darkMode={darkMode}
                />
            )}
        </>
    );
};
