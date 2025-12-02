import React from 'react';
import { Clock } from 'lucide-react';

interface FooterProps {
    leftContent?: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ leftContent }) => {
    return (
        <div className="h-9 bg-white border-t border-gray-200 flex items-center justify-between px-6 text-[10px] text-gray-500 flex-shrink-0">
            <div className="flex items-center space-x-4">
                {leftContent}
            </div>

            <div className="flex items-center space-x-3">
                <div className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    <span>System Operational</span>
                </div>
                <div className="flex items-center text-gray-400">
                    <Clock size={12} className="mr-1" />
                    <span>Updated just now</span>
                </div>
            </div>
        </div>
    );
};

export default Footer;
