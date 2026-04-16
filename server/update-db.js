require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const schema = `
CREATE TABLE IF NOT EXISTS interview_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    transcript TEXT,
    scores JSONB,
    strengths TEXT[],
    weaknesses TEXT[],
    final_feedback TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDb() {
    console.log('Initializing interview_results table...');
    try {
        await pool.query(schema);
        console.log('✅ Success! Table created.');
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await pool.end();
    }
}

initDb();
