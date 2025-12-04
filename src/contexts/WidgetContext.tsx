import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { widgetService } from '../features/dashboards/widgetService';

interface WidgetContextType {
    pageWidgets: Record<string, any[]>;
    setPageWidgets: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    onUpdateWidget: (pageId: string, newWidgets: any[]) => void;
    refreshWidgets: () => Promise<void>;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const useWidgetContext = () => {
    const context = useContext(WidgetContext);
    if (!context) {
        throw new Error('useWidgetContext must be used within a WidgetProvider');
    }
    return context;
};

export const WidgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageWidgets, setPageWidgets] = useState<Record<string, any[]>>({});

    const refreshWidgets = useCallback(async () => {
        try {
            const widgetsData = await widgetService.getWidgets();
            if (widgetsData) {
                setPageWidgets(widgetsData);
            }
        } catch (error) {
            console.error('Failed to fetch widgets:', error);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        refreshWidgets();
    }, [refreshWidgets]);

    const onUpdateWidget = useCallback((pageId: string, newWidgets: any[]) => {
        setPageWidgets(prev => {
            const updated = {
                ...prev,
                [pageId]: newWidgets
            };
            // Persist to backend
            widgetService.updateWidgets(updated).catch(err => console.error('Failed to save widgets:', err));
            return updated;
        });
    }, []);

    return (
        <WidgetContext.Provider value={{ pageWidgets, setPageWidgets, onUpdateWidget, refreshWidgets }}>
            {children}
        </WidgetContext.Provider>
    );
};
