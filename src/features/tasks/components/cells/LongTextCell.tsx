import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { LongTextEditor } from '../LongTextEditor';

interface LongTextCellProps {
    value: string;
    onChange: (value: string) => void;
    tabIndex?: number;
}

export const LongTextCell: React.FC<LongTextCellProps> = ({ value, onChange, tabIndex }) => {
    const [showEditor, setShowEditor] = useState(false);

    return (
        <>
            <div
                className="w-full h-full relative group cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowEditor(true)}
            >
                <div
                    className="w-full h-full px-2 py-1.5 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
                    tabIndex={tabIndex}
                >
                    {value || <span className="text-gray-400 italic">Empty</span>}
                </div>

                {/* Expand icon on hover */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                    <Maximize2 size={12} />
                </div>
            </div>

            {showEditor && (
                <LongTextEditor
                    value={value}
                    onChange={onChange}
                    onClose={() => setShowEditor(false)}
                />
            )}
        </>
    );
};
