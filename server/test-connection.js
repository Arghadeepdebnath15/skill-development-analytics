require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('Testing connection to Supabase...');
    try {
        const { data, error } = await supabase.from('students').select('*').limit(1);
        if (error) {
            console.error('❌ Connection failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Connection successful!');
            console.log('Data sample:', data);
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    }
})();
