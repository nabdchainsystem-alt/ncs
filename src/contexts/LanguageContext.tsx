import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { translations } from '../translations';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Default to English/LTR for now
    const [language, setLanguageState] = useState<Language>('en');
    const [direction, setDirection] = useState<Direction>('ltr');

    useEffect(() => {
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        setDirection(dir);
        document.documentElement.lang = language;
        document.documentElement.dir = dir;
    }, [language]);

    // Expose to window for debugging
    useEffect(() => {
        (window as any).__LANGUAGE_CONTEXT__ = {
            language,
            direction,
            setLanguage: setLanguageState,
            toggleLanguage: () => setLanguageState(prev => prev === 'en' ? 'ar' : 'en')
        };
    }, [language, direction]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const toggleLanguage = () => {
        setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let current: any = translations[language];

        // Simple look up assuming flat keys in this iteration, but keeping split for future nested support if needed
        // Actually, my structure is flat keys like 'nav.home', so direct lookup is safer for now unless I nested them
        // Looking at my dictionary 'nav.home' is a key itself in the object? 
        // Wait, my dictionary structure was:
        // en: { 'nav.home': 'Home' }
        // So direct lookup is correct.

        return current[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
