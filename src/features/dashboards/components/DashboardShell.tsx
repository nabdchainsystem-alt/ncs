import React from 'react';

interface DashboardShellProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
    title,
    subtitle,
    children,
    headerActions
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className="flex items-center space-x-3">
                    {headerActions}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="w-full space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
