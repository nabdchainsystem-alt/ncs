import { create } from 'zustand';
import { widgetService } from '../services/widgetService';

export interface Widget {
    id: string;
    type: string;
    title?: string;
    [key: string]: any;
}

interface DashboardState {
    pageWidgets: Record<string, Widget[]>;
    isLoading: boolean;
    error: string | null;

    fetchWidgets: () => Promise<void>;
    addWidget: (pageId: string, widget: Widget) => void;
    removeWidget: (pageId: string, widgetId: string) => void;
    updateWidget: (pageId: string, widgetId: string, updates: Partial<Widget>) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    pageWidgets: {},
    isLoading: false,
    error: null,

    fetchWidgets: async () => {
        set({ isLoading: true, error: null });
        try {
            const widgets = await widgetService.getWidgets();
            set({ pageWidgets: widgets || {}, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch widgets:', error);
            set({ error: 'Failed to fetch widgets', isLoading: false });
        }
    },

    addWidget: (pageId, widget) => {
        const { pageWidgets } = get();
        const currentWidgets = pageWidgets[pageId] || [];
        const newWidgets = [...currentWidgets, widget];

        // Optimistic update
        set({
            pageWidgets: {
                ...pageWidgets,
                [pageId]: newWidgets
            }
        });

        // Persist
        widgetService.updateWidgets({
            ...pageWidgets,
            [pageId]: newWidgets
        }).catch(err => {
            console.error('Failed to add widget:', err);
            // Rollback
            set({ pageWidgets });
        });
    },

    removeWidget: (pageId, widgetId) => {
        const { pageWidgets } = get();
        const currentWidgets = pageWidgets[pageId] || [];
        const newWidgets = currentWidgets.filter(w => w.id !== widgetId);

        // Optimistic update
        set({
            pageWidgets: {
                ...pageWidgets,
                [pageId]: newWidgets
            }
        });

        // Persist
        widgetService.updateWidgets({
            ...pageWidgets,
            [pageId]: newWidgets
        }).catch(err => {
            console.error('Failed to remove widget:', err);
            // Rollback
            set({ pageWidgets });
        });
    },

    updateWidget: (pageId, widgetId, updates) => {
        const { pageWidgets } = get();
        const currentWidgets = pageWidgets[pageId] || [];
        const newWidgets = currentWidgets.map(w =>
            w.id === widgetId ? { ...w, ...updates } : w
        );

        // Optimistic update
        set({
            pageWidgets: {
                ...pageWidgets,
                [pageId]: newWidgets
            }
        });

        // Persist
        widgetService.updateWidgets({
            ...pageWidgets,
            [pageId]: newWidgets
        }).catch(err => {
            console.error('Failed to update widget:', err);
            // Rollback
            set({ pageWidgets });
        });
    }
}));
