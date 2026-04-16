-- SQL Schema for Interview Results
CREATE TABLE IF NOT EXISTS interview_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    transcript TEXT,
    scores JSONB, -- Stores { technical, communication, confidence, overall }
    strengths TEXT[],
    weaknesses TEXT[],
    final_feedback TEXT,
    video_url TEXT, -- Optional: If we ever store the video in Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- Simple Policy: Everyone can read for now (adjust as needed for production)
CREATE POLICY "Public Read Access" ON interview_results FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON interview_results FOR INSERT WITH CHECK (true);
