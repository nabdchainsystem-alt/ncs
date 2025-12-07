import { supabase, getCompanyId } from '../../lib/supabase';

export const widgetService = {
    getWidgets: async (): Promise<Record<string, any[]>> => {
        const { data, error } = await supabase
            .from('widgets')
            .select('*')
            .eq('company_id', getCompanyId());

        if (error) {
            console.error('Error fetching widgets:', error);
            return {};
        }

        // Convert array of rows to Record<userId, layoutData>
        const widgetMap: Record<string, any[]> = {};
        data.forEach((row: any) => {
            // Check if layout_data is already array or wrapped
            widgetMap[row.user_id] = row.layout_data || [];
        });
        return widgetMap;
    },

    updateWidgets: async (widgets: Record<string, any[]>): Promise<void> => {
        const companyId = getCompanyId();

        // We need to upsert rows for each user
        // widgets keys are userIds
        const upsertData = Object.entries(widgets).map(([userId, layoutData]) => ({
            user_id: userId,
            layout_data: layoutData,
            company_id: companyId
            // Note: If ID is needed for upsert conflict, we might need to fetch IDs first or allow duplicate user entries?
            // Schema has id as PK (uuid). unique constraint on (user_id, company_id) would be better.
            // For now, let's try to Delete then Insert? Or check if row exists.
            // Best is to have a unique constraint on user_id per company in DB.
            // If the schema didn't enforce it, we might get duplicates. 
            // I'll assume we delete existing or handle it.
            // Simpler strategy: upsert matches on (id) but we don't have id here.
            // Let's assume we fetch first or query by user_id to update.
        }));

        // Since we don't have unique constraint strictly defined in schema artifact (it was generic),
        // let's do a sequence: Delete for these users, then Insert? Or update individually.
        // Update individually is safer to avoid ID churn if used elsewhere.

        for (const [userId, layoutData] of Object.entries(widgets)) {
            // Check if exists
            const { data: existing } = await supabase
                .from('widgets')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (existing) {
                await supabase
                    .from('widgets')
                    .update({ layout_data: layoutData })
                    .eq('id', existing.id);
            } else {
                await supabase.from('widgets').insert({
                    user_id: userId,
                    layout_data: layoutData,
                    company_id: companyId
                });
            }
        }
    }
};
