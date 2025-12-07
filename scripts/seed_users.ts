
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VIEW_WATER_USERS = [
    {
        id: 'u4', // Keeping existing IDs or letting DB generate. Let's use specific IDs for testing consistency.
        name: 'View Water Admin',
        email: 'admin@viewwater.com',
        password: '123', // In real app, hash this!
        role: 'Admin',
        company_id: 'view-water-factory',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ViewAdmin'
    },
    {
        id: 'u5',
        name: 'View Worker',
        email: 'worker@viewwater.com',
        password: '123',
        role: 'Member',
        company_id: 'view-water-factory',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ViewWorker'
    }
];

const SMT_USERS = [
    {
        id: 'u6',
        name: 'SMT Master',
        email: 'master@smt.com',
        password: '123',
        role: 'Admin',
        company_id: 'smt-plastic-factory',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SMTMaster'
    },
    {
        id: 'u7',
        name: 'SMT Operator',
        email: 'operator@smt.com',
        password: '123',
        role: 'Member',
        company_id: 'smt-plastic-factory',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SMTOp'
    }
];

async function seedUsers() {
    console.log('🌱 Seeding View Water Factory Users...');
    const { error: error1 } = await supabase.from('users').upsert(VIEW_WATER_USERS);
    if (error1) console.error('Error seeding View Water:', error1);
    else console.log('✅ View Water Users Created');

    console.log('🌱 Seeding SMT Plastic Factory Users...');
    const { error: error2 } = await supabase.from('users').upsert(SMT_USERS);
    if (error2) console.error('Error seeding SMT:', error2);
    else console.log('✅ SMT Plastic Users Created');
}

seedUsers();
