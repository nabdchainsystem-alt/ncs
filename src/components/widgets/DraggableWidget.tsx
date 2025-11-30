import React from 'react';
import { X, GripVertical } from 'lucide-react';

interface DraggableWidgetProps {
    id: string;
    title?: string;
    onRemove?: () => void;
    children: React.ReactNode;
    className?: string;
    // Props injected by react-grid-layout
    style?: React.CSSProperties;
    className_rgl?: string;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

// Forward ref is required for react-grid-layout
export const DraggableWidget = React.forwardRef<HTMLDivElement, DraggableWidgetProps>(
    ({ id, title, onRemove, children, style, className, className_rgl, onMouseDown, onMouseUp, onTouchEnd, ...props }, ref) => {
        return (
            <div
                ref={ref}
                style={style}
                className={`${className_rgl || ''} ${className || ''} bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden group relative`}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onTouchEnd={onTouchEnd}
                {...props}
            >
                {/* Drag Handle & Header */}
                <div className="h-8 flex items-center justify-between px-2 border-b border-gray-100 bg-gray-50/50 cursor-move draggable-handle">
                    <div className="flex items-center space-x-2 text-gray-500">
                        <GripVertical size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xs font-medium truncate max-w-[150px]">{title || 'Widget'}</span>
                    </div>
                    <div className="flex items-center">
                        {onRemove && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-2">
                    {children}
                </div>
            </div>
        );
    }
);

DraggableWidget.displayName = 'DraggableWidget';
