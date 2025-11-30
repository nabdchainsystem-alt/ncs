import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ViewType } from '../types/shared';

interface NavigationContextType {
    activePage: string;
    setActivePage: (page: string) => void;
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    isImmersive: boolean;
    getPageTitle: () => string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activePage, setActivePage] = useState(() => localStorage.getItem('activePage') || 'home');
    const [currentView, setCurrentView] = useState<ViewType>('list');

    // Persist activePage
    useEffect(() => {
        localStorage.setItem('activePage', activePage);
    }, [activePage]);

    const isImmersive = ['space', 'ocean'].includes(activePage);

    const getPageTitle = () => {
        const map: Record<string, string> = {
            home: 'Home',
            inbox: 'Inbox',
            sprints: 'Engineering / Sprints',
            frontend: 'Engineering / Frontend App',
            backend: 'Engineering / Backend API',
            overview: 'Dashboards / Overview',
            goals: 'Dashboards / Goals',
            space: 'Space',
            ocean: 'Deep Ocean',
            'supply-chain/procurement': 'Supply Chain / Procurement',
            'supply-chain/warehouse': 'Supply Chain / Warehouse',
            'supply-chain/shipping': 'Supply Chain / Shipping',
            'supply-chain/planning': 'Supply Chain / Planning',
            'supply-chain/fleet': 'Supply Chain / Fleet',
            operations: 'Departments / Operations',
            business: 'Departments / Business',
            support: 'Departments / Business Support',
            reminders: 'Dashboards / Reminders',
            tasks: 'Dashboards / Tasks',
            vault: 'Dashboards / Vault',
            teams: 'Dashboards / Teams',
            discussion: 'Discussion'
        };

        if (map[activePage]) return map[activePage];

        if (activePage.startsWith('supply-chain/')) {
            const parts = activePage.split('/');
            if (parts.length >= 3) {
                return `Supply Chain / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
            }
            return `Supply Chain / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)}`;
        }
        if (activePage.startsWith('operations/')) {
            const parts = activePage.split('/');
            return `Operations / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
        }
        if (activePage.startsWith('business/')) {
            const parts = activePage.split('/');
            return `Business / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
        }
        if (activePage.startsWith('support/')) {
            const parts = activePage.split('/');
            return `Business Support / ${parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1)} / ${parts[2]?.charAt(0).toUpperCase() + parts[2]?.slice(1)}`;
        }

        return 'Space';
    };

    return (
        <NavigationContext.Provider value={{
            activePage,
            setActivePage,
            currentView,
            setCurrentView,
            isImmersive,
            getPageTitle
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
