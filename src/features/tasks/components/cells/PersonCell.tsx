import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Plus } from 'lucide-react';
import { PEOPLE } from '../../../rooms/boardTypes';

interface PersonCellProps {
    personId: string | null;
    onChange: (newPersonId: string | null) => void;
    tabIndex?: number;
}

export const PersonCell: React.FC<PersonCellProps> = ({ personId, onChange, tabIndex }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const selectedPerson = PEOPLE.find(p => p.id === personId);

    const toggleDropdown = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownHeight = 250; // Approximate height
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight;

        setCoords({
            top: showAbove ? rect.top + window.scrollY - dropdownHeight - 5 : rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX - 90 // Center align approx
        });
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="relative w-full h-full flex justify-center items-center group">
                <div
                    onClick={toggleDropdown}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown(e);
                        }
                    }}
                    tabIndex={tabIndex}
                    className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                >
                    {selectedPerson ? (
                        <div className={"w-6 h-6 rounded-full text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-white shadow-md " + selectedPerson.color} title={selectedPerson.name}>
                            {selectedPerson.initials}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 border border-dashed border-gray-300 hover:border-gray-400 transition-all shadow-sm">
                            <User size={12} strokeWidth={2.5} />
                        </div>
                    )}

                    {!selectedPerson && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                                <Plus size={12} className="text-black/60" strokeWidth={3} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-50 bg-white shadow-2xl rounded-xl border border-gray-200 p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 min-w-[180px]"
                        style={{ top: coords.top, left: coords.left }}
                    >
                        <div className="text-xs font-semibold text-gray-400 mb-1 px-2 uppercase tracking-wider py-1">Select Person</div>
                        {PEOPLE.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    onChange(p.id);
                                    setIsOpen(false);
                                }}
                                className={"flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors " + (personId === p.id ? 'bg-blue-50' : '')}
                            >
                                <div className={"w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-bold " + p.color}>
                                    {p.initials}
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{p.name}</span>
                                {personId === p.id && <span className="ml-auto text-blue-500">✓</span>}
                            </div>
                        ))}
                        <div className="border-t border-gray-100 my-1"></div>
                        <div
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-red-50 text-red-500 text-sm rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-xs">✕</span>
                            Clear Selection
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};
