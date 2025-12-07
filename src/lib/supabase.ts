import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Helper to get current company ID from environment or user selection
export const getCompanyId = (): string => {
    // Check localStorage first (Dynamic selection)
    if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('ncs_company_id');
        if (storedId) return storedId;
    }
    // Fallback to Env var or Default
    return import.meta.env.VITE_COMPANY_ID || 'view-water-factory';
};

// Helper to set company ID
export const setCompanyId = (id: string) => {
    localStorage.setItem('ncs_company_id', id);
};
