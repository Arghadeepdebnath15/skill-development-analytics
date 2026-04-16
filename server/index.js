require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const aiRoutes = require('./routes/ai');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5001;

const { supabase } = require('./db');

// Export for other files (maintaining if needed, though db.js is preferred)
module.exports = { supabase };

// Middleware
app.use(cors());
app.use(express.json());

// Connection Check
(async () => {
    try {
        const { data, error } = await supabase.from('students').select('*').limit(1);
        if (error) {
            console.error('❌ Supabase connection error:', error.message);
        } else {
            console.log('✅ Connected to Supabase successfully!');
        }
    } catch (err) {
        console.error('❌ Supabase unexpected error:', err.message);
    }
})();

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Skill Development Analytics API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
