import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isBrainOpen: boolean;
    setBrainOpen: (isOpen: boolean) => void;
    isAddCardsOpen: boolean;
    setAddCardsOpen: (isOpen: boolean) => void;
    isTableBuilderOpen: boolean;
    setTableBuilderOpen: (isOpen: boolean) => void;
    isTemplateModalOpen: boolean;
    setTemplateModalOpen: (isOpen: boolean) => void;
    appStyle: 'main' | 'floating';
    setAppStyle: (style: 'main' | 'floating') => void;
    theme: 'light' | 'nexus';
    setTheme: (theme: 'light' | 'nexus') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBrainOpen, setBrainOpen] = useState(false);
    const [isAddCardsOpen, setAddCardsOpen] = useState(false);
    const [isTableBuilderOpen, setTableBuilderOpen] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [appStyle, setAppStyle] = useState<'main' | 'floating'>(() => {
        if (typeof window === 'undefined') return 'main';
        const saved = localStorage.getItem('appStyle');
        return (saved === 'main' || saved === 'floating') ? saved : 'main';
    });
    const [theme, setTheme] = useState<'light' | 'nexus'>(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem('appTheme');
        return (saved === 'light' || saved === 'nexus') ? saved : 'light';
    });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('appStyle', appStyle);
        }
    }, [appStyle]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('appTheme', theme);
        }
    }, [theme]);

    return (
        <UIContext.Provider value={{
            isBrainOpen,
            setBrainOpen,
            isAddCardsOpen,
            setAddCardsOpen,
            isTableBuilderOpen,
            setTableBuilderOpen,
            isTemplateModalOpen,
            setTemplateModalOpen,
            appStyle,
            setAppStyle,
            theme,
            setTheme
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
