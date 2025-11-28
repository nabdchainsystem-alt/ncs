import { getApiUrl } from '../../utils/config';

const API_URL = getApiUrl();

export const widgetService = {
    getWidgets: async (): Promise<Record<string, any[]>> => {
        const res = await fetch(`${API_URL}/widgets`);
        return res.json();
    },

    updateWidgets: async (widgets: Record<string, any[]>): Promise<void> => {
        await fetch(`${API_URL}/widgets`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(widgets)
        });
    }
};
