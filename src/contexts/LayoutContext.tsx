import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigation } from './NavigationContext';
import { useWidgets } from '../features/dashboards/hooks/useWidgets';

interface Tab {
    id: string;
    name: string;
}

interface LayoutContextType {
    pageTabs: Record<string, Tab[]>;
    setPageTabs: React.Dispatch<React.SetStateAction<Record<string, Tab[]>>>;
    activeTabByPage: Record<string, string>;
    setActiveTabByPage: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    getActiveTabId: (pageId: string) => string | undefined;
    getTabsForPage: (pageId: string) => Tab[];
    handleCreateDashboardTab: () => void;
    handleDeleteDashboardTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activePage } = useNavigation();
    const { setPageWidgets, onUpdateWidget } = useWidgets('app' as any); // Assuming 'app' view state for now

    const [pageTabs, setPageTabs] = useState<Record<string, Tab[]>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            const raw = localStorage.getItem('page-tabs');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    const [activeTabByPage, setActiveTabByPage] = useState<Record<string, string>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            const raw = localStorage.getItem('active-tab-by-page');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    // Persist tabs
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('page-tabs', JSON.stringify(pageTabs));
        } catch (err) {
            console.warn('Failed to persist tabs', err);
        }
    }, [pageTabs]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('active-tab-by-page', JSON.stringify(activeTabByPage));
        } catch (err) {
            console.warn('Failed to persist active tab', err);
        }
    }, [activeTabByPage]);

    // Ensure each page has a default tab
    useEffect(() => {
        if (!pageTabs[activePage]) return;
        setActiveTabByPage(prev => {
            if (prev[activePage] && pageTabs[activePage]?.some(t => t.id === prev[activePage])) return prev;
            const firstTab = pageTabs[activePage][0]?.id;
            if (!firstTab) return prev;
            return { ...prev, [activePage]: firstTab };
        });
    }, [activePage, pageTabs]);

    const getTabsForPage = (pageId: string) => (pageTabs[pageId] || []).filter(t => t.id !== 'main');

    const getActiveTabId = (pageId: string) => {
        const tabs = getTabsForPage(pageId);
        const stored = activeTabByPage[pageId];
        if (stored && tabs.some(t => t.id === stored)) return stored;
        return tabs[0]?.id;
    };

    const setActiveTab = (tabId: string) => setActiveTabByPage(prev => ({ ...prev, [activePage]: tabId }));

    const handleCreateDashboardTab = () => {
        const existingTabs = getTabsForPage(activePage);
        const nextIndex = existingTabs.length + 1;
        const tabName = `Dashboard ${nextIndex}`;
        const newTabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTab = { id: newTabId, name: tabName };

        setPageTabs(prev => {
            const current = (prev[activePage] || []).filter(t => t.id !== 'main');
            return { ...prev, [activePage]: [...current, newTab] };
        });

        setActiveTabByPage(prev => ({ ...prev, [activePage]: newTabId }));
        onUpdateWidget(`${activePage}::${newTabId}`, []);
    };

    const handleDeleteDashboardTab = (tabId: string) => {
        setPageTabs(prev => {
            const current = getTabsForPage(activePage).filter(t => t.id !== tabId);
            const nextTabs = { ...prev, [activePage]: current };
            return nextTabs;
        });
        setActiveTabByPage(prev => {
            if (prev[activePage] === tabId) {
                const fallback = getTabsForPage(activePage).filter(t => t.id !== tabId)[0]?.id;
                const next = { ...prev };
                if (fallback) next[activePage] = fallback;
                else delete next[activePage];
                return next;
            }
            return prev;
        });
        // Clear widgets for that tab
        onUpdateWidget(`${activePage}::${tabId}`, []);
        setPageWidgets(prev => {
            const clone = { ...prev };
            delete clone[`${activePage}::${tabId}`];
            return clone;
        });
    };

    return (
        <LayoutContext.Provider value={{
            pageTabs,
            setPageTabs,
            activeTabByPage,
            setActiveTabByPage,
            getActiveTabId,
            getTabsForPage,
            handleCreateDashboardTab,
            handleDeleteDashboardTab,
            setActiveTab
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
