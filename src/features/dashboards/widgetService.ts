import { supabase, getCompanyId } from '../../lib/supabase';

const STORAGE_KEY = 'app_widgets_storage';

export const widgetService = {
    getWidgets: async (): Promise<Record<string, any[]>> => {
        try {
            // Try to get from localStorage first (Local-First Architecture)
            if (typeof window !== 'undefined') {
                const localData = localStorage.getItem(STORAGE_KEY);
                if (localData) {
                    return JSON.parse(localData);
                }
            }

            // Fallback to Supabase if needed, or return empty
            // For this fix, we prioritize localStorage to ensure the user's immediate issue is resolved
            return {};
        } catch (error) {
            console.error('Error fetching widgets:', error);
            return {};
        }
    },

    updateWidgets: async (widgets: Record<string, any[]>): Promise<void> => {
        try {
            // Save to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
            }

            // Optional: Sync to Supabase in background if needed in future
            // For now, we rely on local persistence to match LayoutContext behavior
        } catch (error) {
            console.error('Error saving widgets:', error);
        }
    }
};
