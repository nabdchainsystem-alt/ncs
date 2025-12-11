import React from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Link, Image, Code
} from 'lucide-react';

interface ComposeToolbarProps {
    colors: any;
    onAction: (action: string) => void;
}

export const ComposeToolbar: React.FC<ComposeToolbarProps> = ({ colors, onAction }) => {

    // Helper to render a toolbar button
    const ToolBtn = ({ icon: Icon, action, label }: { icon: any, action: string, label: string }) => (
        <button
            onClick={() => onAction(action)}
            className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 ${colors.textMuted} hover:${colors.text} transition-colors`}
            title={label}
            type="button"
        >
            <Icon size={16} strokeWidth={2} />
        </button>
    );

    const Divider = () => <div className={`w-px h-5 mx-1 bg-black/10 dark:bg-white/10 self-center`} />;

    return (
        <div className={`flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b ${colors.border} bg-black/5 dark:bg-white/5 rounded-t-md mb-2`}>
            {/* Formatting */}
            <ToolBtn icon={Bold} action="bold" label="Bold" />
            <ToolBtn icon={Italic} action="italic" label="Italic" />
            <ToolBtn icon={Underline} action="underline" label="Underline" />
            <ToolBtn icon={Strikethrough} action="strikethrough" label="Strikethrough" />

            <Divider />

            {/* Lists */}
            <ToolBtn icon={List} action="bullet" label="Bullet List" />
            <ToolBtn icon={ListOrdered} action="number" label="Numbered List" />

            <Divider />

            {/* Alignment */}
            <ToolBtn icon={AlignLeft} action="align-left" label="Align Left" />
            <ToolBtn icon={AlignCenter} action="align-center" label="Align Center" />
            <ToolBtn icon={AlignRight} action="align-right" label="Align Right" />

            <Divider />

            {/* Insert */}
            <ToolBtn icon={Link} action="link" label="Insert Link" />
            <ToolBtn icon={Image} action="image" label="Insert Image" />
            <ToolBtn icon={Code} action="code" label="Code Block" />
        </div>
    );
};
