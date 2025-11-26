-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('contributor', 'company');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE reward_type AS ENUM ('airtime', 'mobile_money', 'grocery_voucher');
CREATE TYPE reward_status AS ENUM ('pending', 'awarded', 'redeemed');
CREATE TYPE question_status AS ENUM ('active', 'completed', 'archived');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  name TEXT,
  country TEXT,
  languages TEXT[] DEFAULT '{}',
  expertise_fields TEXT[] DEFAULT '{}',
  trust_score DECIMAL(5,2) DEFAULT 50.00 CHECK (trust_score >= 0 AND trust_score <= 100),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expertise fields table
CREATE TABLE public.expertise_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  difficulty_level difficulty_level DEFAULT 'easy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.expertise_fields(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  difficulty_level difficulty_level NOT NULL,
  status question_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  consensus_score DECIMAL(5,2) CHECK (consensus_score >= 0 AND consensus_score <= 100),
  correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, contributor_id)
);

-- Rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_type reward_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  status reward_status DEFAULT 'pending',
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings table (tracks trust score changes)
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  rating_change DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company dashboard stats (materialized view or table)
CREATE TABLE public.company_dashboard_stats (
  company_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  average_consensus_score DECIMAL(5,2) DEFAULT 0,
  average_contributor_rating DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_trust_score ON public.users(trust_score);
CREATE INDEX idx_questions_company_id ON public.questions(company_id);
CREATE INDEX idx_questions_field_id ON public.questions(field_id);
CREATE INDEX idx_questions_status ON public.questions(status);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_answers_contributor_id ON public.answers(contributor_id);
CREATE INDEX idx_answers_correct ON public.answers(correct);
CREATE INDEX idx_rewards_contributor_id ON public.rewards(contributor_id);
CREATE INDEX idx_rewards_status ON public.rewards(status);
CREATE INDEX idx_ratings_contributor_id ON public.ratings(contributor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_dashboard_stats_updated_at BEFORE UPDATE ON public.company_dashboard_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_dashboard_stats ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Expertise fields policies (public read)
CREATE POLICY "Anyone can view expertise fields"
  ON public.expertise_fields FOR SELECT
  USING (true);

-- Questions policies
CREATE POLICY "Contributors can view active questions they can answer"
  ON public.questions FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'contributor'
      AND users.onboarding_completed = true
      AND (
        questions.field_id::text = ANY(users.expertise_fields)
        OR array_length(users.expertise_fields, 1) IS NULL
      )
      AND questions.difficulty_level = ANY(
        CASE 
          WHEN users.trust_score >= 80 THEN ARRAY['easy'::difficulty_level]
          WHEN users.trust_score >= 60 THEN ARRAY['easy'::difficulty_level, 'medium'::difficulty_level]
          ELSE ARRAY['easy'::difficulty_level, 'medium'::difficulty_level, 'hard'::difficulty_level]
        END
      )
    )
  );

CREATE POLICY "Companies can view their own questions"
  ON public.questions FOR SELECT
  USING (
    company_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Companies can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    company_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Companies can update their own questions"
  ON public.questions FOR UPDATE
  USING (
    company_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

-- Answers policies
CREATE POLICY "Contributors can view their own answers"
  ON public.answers FOR SELECT
  USING (
    contributor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'contributor')
  );

CREATE POLICY "Companies can view answers to their questions"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      WHERE questions.id = answers.question_id
      AND questions.company_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "Contributors can create answers"
  ON public.answers FOR INSERT
  WITH CHECK (
    contributor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'contributor')
    AND EXISTS (
      SELECT 1 FROM public.questions
      WHERE questions.id = answers.question_id
      AND questions.status = 'active'
    )
  );

-- Rewards policies
CREATE POLICY "Contributors can view their own rewards"
  ON public.rewards FOR SELECT
  USING (
    contributor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'contributor')
  );

-- Ratings policies
CREATE POLICY "System can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Contributors can view their own ratings"
  ON public.ratings FOR SELECT
  USING (
    contributor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'contributor')
  );

-- Company dashboard stats policies
CREATE POLICY "Companies can view their own stats"
  ON public.company_dashboard_stats FOR SELECT
  USING (
    company_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

