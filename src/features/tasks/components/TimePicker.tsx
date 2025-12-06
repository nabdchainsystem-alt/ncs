import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useQuickAction } from '../../../hooks/useQuickAction';

interface TimePickerProps {
    time?: string; // Format "HH:mm" (24h)
    onSelect: (time: string) => void;
    onClose: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

export const TimePicker: React.FC<TimePickerProps> = ({ time, onSelect, onClose }) => {
    // Fix: Specify HTMLDivElement for the generic type
    const { ref } = useQuickAction<HTMLDivElement>({
        onCancel: onClose,
        initialActive: true,
    });

    // Parse initial time
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    useEffect(() => {
        if (time) {
            const [h, m] = time.split(':');
            let hour = parseInt(h);
            const period = hour >= 12 ? 'PM' : 'AM';

            if (hour === 0) hour = 12;
            else if (hour > 12) hour -= 12;

            setSelectedHour(hour);
            setSelectedMinute(m);
            setSelectedPeriod(period);
        } else {
            // Default to current time rounded to next 30 min? Or just 9:00 AM
            const now = new Date();
            let h = now.getHours();
            const m = now.getMinutes();
            const p = h >= 12 ? 'PM' : 'AM';
            if (h === 0) h = 12;
            else if (h > 12) h -= 12;

            setSelectedHour(h);
            setSelectedMinute(m.toString().padStart(2, '0'));
            setSelectedPeriod(p);
        }
    }, []);

    const handleSave = () => {
        let hour = selectedHour;
        if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
        if (selectedPeriod === 'AM' && hour === 12) hour = 0;

        const formattedTime = `${hour.toString().padStart(2, '0')}:${selectedMinute}`;
        onSelect(formattedTime);
        onClose();
    };

    const ScrollColumn = ({
        items,
        selected,
        onSelect,
        label
    }: {
        items: (string | number)[],
        selected: string | number,
        onSelect: (val: any) => void,
        label?: string
    }) => {
        return (
            <div className="h-48 w-16 overflow-y-auto snap-y snap-mandatory flex flex-col items-center pt-[88px] pb-[88px] relative no-scrollbar">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                {items.map((item) => (
                    <button
                        key={item}
                        onClick={() => onSelect(item)}
                        className={`h-8 flex-shrink-0 snap-center w-full flex items-center justify-center text-lg font-medium transition-all duration-200 ${item == selected
                            ? 'text-black font-bold scale-110'
                            : 'text-gray-300 scale-90'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[260px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Set Time</span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="relative flex justify-center py-4 bg-white">
                {/* Selection Highlight Bar */}
                <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 pointer-events-none mx-4 border-t border-b border-gray-200" />

                <div className="flex gap-2 relative z-10 bg-transparent items-center">
                    <ScrollColumn
                        items={HOURS}
                        selected={selectedHour}
                        onSelect={setSelectedHour}
                    />
                    <div className="flex items-center pb-1 text-gray-300 font-bold text-xl">:</div>
                    <ScrollColumn
                        items={MINUTES}
                        selected={selectedMinute}
                        onSelect={setSelectedMinute}
                    />
                    <div className="w-2"></div>
                    <ScrollColumn
                        items={PERIODS}
                        selected={selectedPeriod}
                        onSelect={setSelectedPeriod}
                    />
                </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={handleSave}
                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors active:scale-[0.98]"
                >
                    Set Time
                </button>
            </div>
        </div>
    );
};
