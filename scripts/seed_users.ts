
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

// Using valid UUIDs to satisfy Postgres uuid type
// Using valid UUIDs to satisfy Postgres uuid type
const VIEW_WATER_USERS = [
    {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Mohamed Supply Chain Specialist',
        email: 'mohamed@nabdchain-view.com',
        password: '123',
        role: 'Admin',
        company_id: 'view-wf54321', // Updated Server ID
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ViewAdmin'
    },
    {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        name: 'Morad Supply Chain Manager',
        email: 'morad@nabchain-view.com',
        password: '123',
        role: 'Member',
        company_id: 'view-wf54321',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ViewWorker'
    },
    {
        id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
        name: 'Max Nabd',
        email: 'max@nabdchain.com',
        password: '1',
        role: 'Admin',
        company_id: 'view-wf54321',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max'
    },
    {
        id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f66',
        name: 'Master Account',
        email: 'master@nabdchain.com',
        password: '1',
        role: 'Admin',
        company_id: 'view-wf54321',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master'
    }
];

const SMT_USERS = [
    {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        name: 'Hasan Factory Manager',
        email: 'hasan@nabdchain-smt.com',
        password: '123',
        role: 'Admin',
        company_id: 'smt-pf98765', // Updated Server ID
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SMTMaster'
    },
    {
        id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
        name: 'Mahdy Purchasing Manager',
        email: 'magdy@nabdchain-smt.com',
        password: '123',
        role: 'Member',
        company_id: 'smt-pf98765', // Updated Server ID
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
