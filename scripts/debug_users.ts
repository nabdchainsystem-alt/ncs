
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('--- Debugging User Fetch ---');
    console.log('Connecting to Supabase:', supabaseUrl);

    try {
        // 1. Fetch all users (admin view)
        console.log('\nQuerying "users" table...');
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name, company_id')
            .limit(10);

        if (error) {
            console.error('Error fetching users:', error.message);
        } else {
            console.log(`Found ${users.length} users:`);
            users.forEach(u => console.log(` - ${u.name} (${u.email}) [Company: ${u.company_id}]`));
        }

        // 2. Check if auth service logic works (filtering by company?)
        // We don't have the context of the logged-in user here fully, 
        // but we can see what data is raw visible.

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkUsers();
