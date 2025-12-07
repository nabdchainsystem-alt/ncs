import { supabase, getCompanyId } from '../../lib/supabase';
import { GTDItem, Project } from './components/GTDSystemWidget';

export const gtdService = {
    getItems: async (): Promise<GTDItem[]> => {
        const companyId = getCompanyId();
        const { data, error } = await supabase
            .from('gtd_items')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching GTD items:', error);
            return [];
        }

        return (data || []).map((i: any) => ({
            id: Number(i.id), // Convert back to number for frontend compatibility
            text: i.text,
            description: i.description,
            status: i.status,
            projectId: i.project_id ? Number(i.project_id) : undefined,
            contextId: i.context_id,
            energy: i.energy,
            time: i.time,
            dueDate: i.due_date,
            delegatedTo: i.delegated_to,
            createdAt: Number(i.created_at),
            completedAt: i.completed_at ? Number(i.completed_at) : undefined,
            parentId: i.parent_id ? Number(i.parent_id) : undefined
        }));
    },

    saveItem: async (item: GTDItem) => {
        const companyId = getCompanyId();
        const dbItem = {
            id: item.id.toString(),
            text: item.text,
            description: item.description,
            status: item.status,
            project_id: item.projectId?.toString(),
            context_id: item.contextId,
            energy: item.energy,
            time: item.time,
            due_date: item.dueDate,
            delegated_to: item.delegatedTo,
            created_at: item.createdAt,
            completed_at: item.completedAt,
            parent_id: item.parentId?.toString(),
            company_id: companyId
        };

        const { error } = await supabase
            .from('gtd_items')
            .upsert(dbItem);

        if (error) console.error('Error saving GTD item:', error);
    },

    deleteItem: async (id: number) => {
        const { error } = await supabase
            .from('gtd_items')
            .delete()
            .eq('id', id.toString());

        if (error) console.error('Error deleting GTD item:', error);
    },

    getProjects: async (): Promise<Project[]> => {
        const companyId = getCompanyId();
        const { data, error } = await supabase
            .from('gtd_projects')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching GTD projects:', error);
            return [];
        }

        return (data || []).map((p: any) => ({
            id: Number(p.id),
            name: p.name,
            status: p.status,
            color: p.color,
            items: p.items || [] // This might need parsing if stored as JSONB
        }));
    },

    saveProject: async (project: Project) => {
        const companyId = getCompanyId();
        const dbProject = {
            id: project.id.toString(),
            name: project.name,
            status: project.status,
            color: project.color,
            items: project.items,
            company_id: companyId
        };

        const { error } = await supabase
            .from('gtd_projects')
            .upsert(dbProject);

        if (error) console.error('Error saving GTD project:', error);
    }
};
