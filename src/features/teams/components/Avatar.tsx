import React from 'react';

interface AvatarProps {
    src: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'busy';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', status, className = '' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
        xl: 'w-16 h-16',
    };

    const statusColors = {
        online: 'bg-emerald-500',
        offline: 'bg-stone-400',
        busy: 'bg-amber-500',
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <img
                src={src}
                alt={alt}
                className={`${sizeClasses[size]} rounded-full object-cover border border-stone-200 dark:border-stone-700 shadow-sm`}
            />
            {status && (
                <span
                    className={`absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 ${statusColors[status]}`}
                />
            )}
        </div>
    );
};

export default Avatar;
