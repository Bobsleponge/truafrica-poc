-- Migration 003: Campaigns, Pricing, API, and Validation Extensions
-- Adds campaign management, pricing engine, API infrastructure, and multi-layer validation support
-- 
-- IMPORTANT: This migration requires that migration 003a_add_admin_role.sql has been run first
-- to add the 'admin' value to the user_role enum. Enum values must be committed before use.

-- Create question_type enum
CREATE TYPE question_type AS ENUM ('rating', 'multiple_choice', 'open_text', 'audio');

-- Create campaign_status enum
CREATE TYPE campaign_status AS ENUM ('draft', 'running', 'completed', 'archived');

-- Create validation_type enum
CREATE TYPE validation_type AS ENUM ('majority_voting', 'text_similarity', 'ml_confidence', 'human_validator');

-- Create flagged_answer_status enum
CREATE TYPE flagged_answer_status AS ENUM ('pending', 'resolved', 'invalid');

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  target_countries TEXT[] DEFAULT '{}',
  target_demo JSONB, -- Flexible JSON for demographic filters (age, gender, location, etc.)
  status campaign_status DEFAULT 'draft',
  needs_question_design BOOLEAN DEFAULT FALSE, -- Flag for TruAfrica-designed questions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign briefs table
CREATE TABLE public.campaign_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  goals TEXT,
  key_questions TEXT[],
  constraints TEXT,
  languages TEXT[] DEFAULT '{}',
  budget DECIMAL(12,2),
  timeline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- Campaign questions junction table (many-to-many)
CREATE TABLE public.campaign_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_type question_type NOT NULL DEFAULT 'open_text',
  required_responses INTEGER DEFAULT 10,
  complexity_level difficulty_level NOT NULL DEFAULT 'easy',
  base_price_per_answer DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, question_id)
);

-- Pricing rules table (config-driven pricing)
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_type question_type NOT NULL,
  base_price_per_answer DECIMAL(10,2) NOT NULL,
  base_cost_per_answer DECIMAL(10,2) NOT NULL,
  multiplier_factors JSONB DEFAULT '{}', -- {complexity: {easy: 1.0, medium: 1.5, hard: 2.0}, urgency: {standard: 1.0, express: 1.3}, country: {...}}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_type)
);

-- Campaign pricing snapshots (historical pricing estimates)
CREATE TABLE public.campaign_pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  estimated_total_cost DECIMAL(12,2) NOT NULL,
  estimated_total_revenue DECIMAL(12,2) NOT NULL,
  estimated_margin DECIMAL(5,2) NOT NULL, -- Percentage
  currency TEXT DEFAULT 'USD',
  breakdown JSONB, -- Detailed breakdown of costs and prices
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key (never store plaintext)
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- API usage events table
CREATE TABLE public.api_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation events table (tracks all validation attempts)
CREATE TABLE public.validation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  validation_type validation_type NOT NULL,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  validator_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL for automated, user_id for human
  metadata JSONB, -- Additional validation data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flagged answers table (for human review)
CREATE TABLE public.flagged_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'low_consensus', 'conflicting_answers', 'suspicious_pattern', etc.
  status flagged_answer_status DEFAULT 'pending',
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add validation_confidence_score to answers table
ALTER TABLE public.answers 
  ADD COLUMN IF NOT EXISTS validation_confidence_score DECIMAL(5,2) CHECK (validation_confidence_score >= 0 AND validation_confidence_score <= 100);

-- Indexes for performance
CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_needs_design ON public.campaigns(needs_question_design);
CREATE INDEX idx_campaign_briefs_campaign_id ON public.campaign_briefs(campaign_id);
CREATE INDEX idx_campaign_questions_campaign_id ON public.campaign_questions(campaign_id);
CREATE INDEX idx_campaign_questions_question_id ON public.campaign_questions(question_id);
CREATE INDEX idx_pricing_rules_question_type ON public.pricing_rules(question_type);
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(is_active);
CREATE INDEX idx_campaign_pricing_snapshots_campaign_id ON public.campaign_pricing_snapshots(campaign_id);
CREATE INDEX idx_api_keys_client_id ON public.api_keys(client_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_revoked ON public.api_keys(revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_usage_events_api_key_id ON public.api_usage_events(api_key_id);
CREATE INDEX idx_api_usage_events_created_at ON public.api_usage_events(created_at);
CREATE INDEX idx_validation_events_answer_id ON public.validation_events(answer_id);
CREATE INDEX idx_validation_events_type ON public.validation_events(validation_type);
CREATE INDEX idx_flagged_answers_answer_id ON public.flagged_answers(answer_id);
CREATE INDEX idx_flagged_answers_status ON public.flagged_answers(status);
CREATE INDEX idx_answers_validation_confidence ON public.answers(validation_confidence_score);

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_briefs_updated_at BEFORE UPDATE ON public.campaign_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all new tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_pricing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_answers ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Clients can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Admins can view all campaigns"
  ON public.campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Clients can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Clients can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Admins can update all campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Campaign briefs policies
CREATE POLICY "Clients can view their own campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_briefs.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "Admins can view all campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Clients can manage their own campaign briefs"
  ON public.campaign_briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_briefs.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

-- Campaign questions policies
CREATE POLICY "Clients can view their own campaign questions"
  ON public.campaign_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_questions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "Admins can view all campaign questions"
  ON public.campaign_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Clients can manage their own campaign questions"
  ON public.campaign_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_questions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "Admins can manage all campaign questions"
  ON public.campaign_questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Pricing rules policies (admin only)
CREATE POLICY "Admins can view pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage pricing rules"
  ON public.pricing_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Campaign pricing snapshots policies
CREATE POLICY "Clients can view their own pricing snapshots"
  ON public.campaign_pricing_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_pricing_snapshots.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "Admins can view all pricing snapshots"
  ON public.campaign_pricing_snapshots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- API keys policies
CREATE POLICY "Clients can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Clients can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

CREATE POLICY "Clients can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (
    client_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
  );

-- API usage events policies (read-only for clients, full access for admins)
CREATE POLICY "Clients can view their own API usage"
  ON public.api_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = api_usage_events.api_key_id
      AND api_keys.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "System can create API usage events"
  ON public.api_usage_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all API usage"
  ON public.api_usage_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Validation events policies
CREATE POLICY "Clients can view validation events for their campaigns"
  ON public.validation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers
      JOIN public.questions ON questions.id = answers.question_id
      JOIN public.campaign_questions ON campaign_questions.question_id = questions.id
      JOIN public.campaigns ON campaigns.id = campaign_questions.campaign_id
      WHERE answers.id = validation_events.answer_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

CREATE POLICY "System can create validation events"
  ON public.validation_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all validation events"
  ON public.validation_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Flagged answers policies
CREATE POLICY "Admins can view all flagged answers"
  ON public.flagged_answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "System can create flagged answers"
  ON public.flagged_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update flagged answers"
  ON public.flagged_answers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Update existing users policies to allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Update existing questions policies to allow admins
CREATE POLICY "Admins can view all questions"
  ON public.questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage all questions"
  ON public.questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Update existing answers policies to allow admins
CREATE POLICY "Admins can view all answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

