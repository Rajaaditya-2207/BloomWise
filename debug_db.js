
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    console.log('Checking for user: rajaaditya0240@gmail.com');
    const { data: byEmail, error: emailError } = await supabase
        .from('farmers')
        .select('*')
        .eq('email', 'rajaaditya0240@gmail.com');

    if (emailError) {
        console.error('Error fetching by email:', emailError);
    } else {
        console.log('Found by email:', byEmail);
    }

    console.log('Checking for phone like %892564819%');
    const { data: byPhone, error: phoneError } = await supabase
        .from('farmers')
        .select('*')
        .ilike('phone', '%892564819%');

    if (phoneError) {
        console.error('Error fetching by phone:', phoneError);
    } else {
        console.log('Found by phone (wildcard):', byPhone);
    }
}

checkUser();
