import { useState, useEffect, useCallback } from 'react';
import { widgetService } from '../widgetService';

export const useWidgets = (viewState: 'landing' | 'login' | 'app') => {
    const [pageWidgets, setPageWidgets] = useState<Record<string, any[]>>({});

    const fetchWidgets = useCallback(async () => {
        try {
            const widgetsData = await widgetService.getWidgets();
            if (widgetsData) {
                setPageWidgets(widgetsData);
            }
        } catch (error) {
            console.error('Failed to fetch widgets:', error);
        }
    }, []);

    useEffect(() => {
        if (viewState === 'app') {
            fetchWidgets();
        }
    }, [viewState, fetchWidgets]);

    const onUpdateWidget = (pageId: string, newWidgets: any[]) => {
        const updatedWidgets = {
            ...pageWidgets,
            [pageId]: newWidgets
        };
        setPageWidgets(updatedWidgets);
        widgetService.updateWidgets(updatedWidgets).catch(err => console.error('Failed to save widgets:', err));
    };

    return {
        pageWidgets,
        setPageWidgets, // Exposing setter for granular updates if needed, or we can add specific methods
        onUpdateWidget
    };
};
