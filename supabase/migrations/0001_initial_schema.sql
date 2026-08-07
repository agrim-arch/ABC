-- Migration: 0001_initial_schema.sql
-- Description: Creates interview_sessions, interview_messages, interview_evaluations, and interview_feedback tables.

-- 1. Table: interview_sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    job_role TEXT NOT NULL,
    candidate_snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('INITIALIZED', 'IN_PROGRESS', 'COMPLETED')),
    current_turn INTEGER NOT NULL DEFAULT 0,
    covered_days INTEGER[] NOT NULL DEFAULT '{}',
    current_focus_day INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: interview_messages
CREATE TABLE IF NOT EXISTS interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
    content TEXT NOT NULL,
    turn_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for chronological message retrieval
CREATE INDEX IF NOT EXISTS idx_interview_messages_session_turn ON interview_messages(session_id, turn_number ASC);

-- 3. Table: interview_evaluations
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NULL CHECK (question_type IS NULL OR question_type IN ('conceptual', 'application', 'debugging', 'system_design', 'follow_up')),
    candidate_answer TEXT NULL,
    score INTEGER NULL CHECK (score IS NULL OR (score >= 1 AND score <= 5)),
    evaluation_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session evaluations retrieval
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_session ON interview_evaluations(session_id);

-- 4. Table: interview_feedback
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS) Policies
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public access matching unauthenticated /api/interview specification
CREATE POLICY "Allow public select on interview_sessions" ON interview_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interview_sessions" ON interview_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on interview_sessions" ON interview_sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public select on interview_messages" ON interview_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interview_messages" ON interview_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on interview_evaluations" ON interview_evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interview_evaluations" ON interview_evaluations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on interview_feedback" ON interview_feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert on interview_feedback" ON interview_feedback FOR INSERT WITH CHECK (true);
