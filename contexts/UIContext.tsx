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
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBrainOpen, setBrainOpen] = useState(false);
    const [isAddCardsOpen, setAddCardsOpen] = useState(false);
    const [isTableBuilderOpen, setTableBuilderOpen] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);

    return (
        <UIContext.Provider value={{
            isBrainOpen,
            setBrainOpen,
            isAddCardsOpen,
            setAddCardsOpen,
            isTableBuilderOpen,
            setTableBuilderOpen,
            isTemplateModalOpen,
            setTemplateModalOpen
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
