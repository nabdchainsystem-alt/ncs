import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        direction: 'up' | 'down' | 'neutral';
        label?: string; // e.g., "+12.5%"
    };
    subtext?: string;
    iconColorClass?: string; // e.g., "text-blue-600"
    iconBgClass?: string; // e.g., "bg-blue-50"
    trendColorClass?: string; // Optional override, otherwise derived from direction
    isEmpty?: boolean;
    onConnect?: () => void;
    onTitleChange?: (newTitle: string) => void;
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    subtext,
    iconColorClass = "text-blue-600",
    iconBgClass = "bg-blue-50",
    isEmpty,
    onConnect,
    onTitleChange
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(title);

    React.useEffect(() => {
        setEditTitle(title);
    }, [title]);

    const handleTitleSubmit = () => {
        setIsEditing(false);
        if (editTitle.trim() !== title && onTitleChange) {
            onTitleChange(editTitle.trim());
        } else {
            setEditTitle(title);
        }
    };

    if (isEmpty) {
        return (
            <div className="bg-white p-5 rounded-2xl border border-dashed border-gray-300 shadow-sm flex flex-col items-center justify-center h-full min-h-[140px] hover:bg-gray-50 transition-colors cursor-pointer group" onClick={onConnect}>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <Icon size={20} className="text-gray-400 group-hover:text-blue-500" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">Connect Data</span>
            </div>
        );
    }

    const getTrendColor = () => {
        if (!trend) return "text-gray-500 bg-gray-50";
        switch (trend.direction) {
            case 'up': return "text-green-600 bg-green-50";
            case 'down': return "text-red-600 bg-red-50";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend.direction) {
            case 'up': return <TrendingUp size={12} className="mr-1" />;
            case 'down': return <TrendingDown size={12} className="mr-1" />;
            default: return <Minus size={12} className="mr-1" />;
        }
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow h-full">
            <div>
                {isEditing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                        className="text-xs font-medium text-gray-900 uppercase tracking-wide border-b border-blue-500 outline-none w-full bg-transparent"
                        autoFocus
                    />
                ) : (
                    <p
                        className="text-xs font-medium text-gray-500 uppercase tracking-wide cursor-text hover:text-blue-600 transition-colors"
                        onClick={() => {
                            if (onTitleChange) setIsEditing(true);
                        }}
                    >
                        {title}
                    </p>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>

                {trend && (
                    <div className={`flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {trend.label || trend.value}
                    </div>
                )}

                {subtext && (
                    <div className="flex items-center mt-2 text-xs font-medium text-gray-500">
                        {subtext}
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${iconBgClass} ${iconColorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

export default KPICard;
