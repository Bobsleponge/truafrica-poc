-- Migration 004: Campaign Builder Extensions
-- Adds comprehensive campaign builder functionality with 20-step wizard support,
-- version control, collaboration, approval workflow, and in-house campaigns

-- Extend question_type enum with new question types
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
-- If values already exist, you'll get an error - this is safe to ignore
DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'single_choice';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'short_text';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'long_text';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'rating_scale';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'comparison';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'image_classification';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'video';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create new enum types (IF NOT EXISTS for enums requires DO block)
DO $$ BEGIN
  CREATE TYPE campaign_mode AS ENUM ('client_mode', 'internal_mode');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('draft', 'internal_review', 'client_review', 'approved', 'locked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE collaborator_role AS ENUM ('owner', 'editor', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE in_house_campaign_type AS ENUM ('translation', 'onboarding', 'feedback');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE data_sensitivity_level AS ENUM ('public', 'internal', 'confidential', 'restricted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reward_distribution_method AS ENUM ('airtime', 'data_voucher', 'mobile_money', 'cashback', 'points');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE currency_type AS ENUM ('ZAR', 'KES', 'NGN', 'USD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend campaigns table with new fields
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS contact_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regions_of_operation TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_sensitivity_level data_sensitivity_level DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS nda_status BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS internal_owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_timelines JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS secondary_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS use_case_description TEXT,
  ADD COLUMN IF NOT EXISTS ai_technical_requirements JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_modality TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_accuracy DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS dataset_size_requirements INTEGER,
  ADD COLUMN IF NOT EXISTS is_in_house BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS campaign_mode campaign_mode DEFAULT 'client_mode',
  ADD COLUMN IF NOT EXISTS total_budget DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS reward_budget DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS per_response_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS validation_fee DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS analytics_fee DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS fine_tuning_fee DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS current_version_id UUID,
  ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS wizard_data JSONB DEFAULT '{}', -- Stores wizard state
  ADD COLUMN IF NOT EXISTS wizard_step INTEGER DEFAULT 1; -- Current step in wizard

-- Extend questions table with new fields
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS branching_rules JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS validation_type validation_type,
  ADD COLUMN IF NOT EXISTS reward_value DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS comparison_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audio_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'; -- For multiple choice, single choice, etc.

-- Campaign versions table (version control)
CREATE TABLE IF NOT EXISTS public.campaign_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL, -- Full campaign data snapshot
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(campaign_id, version_number)
);

-- Campaign collaborators table (real-time collaboration)
CREATE TABLE IF NOT EXISTS public.campaign_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role collaborator_role NOT NULL DEFAULT 'editor',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Campaign approvals table (approval workflow)
CREATE TABLE IF NOT EXISTS public.campaign_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  status approval_status NOT NULL DEFAULT 'draft',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question templates table (question bank)
CREATE TABLE IF NOT EXISTS public.question_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector TEXT NOT NULL, -- Retail, Healthcare, Finance, Transport, Agriculture, Climate, etc.
  question_type question_type NOT NULL,
  content TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward configurations table
CREATE TABLE IF NOT EXISTS public.reward_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  currency currency_type NOT NULL DEFAULT 'USD',
  distribution_method reward_distribution_method NOT NULL DEFAULT 'mobile_money',
  min_payout DECIMAL(10,2),
  max_payout DECIMAL(10,2),
  per_question_rewards JSONB DEFAULT '{}', -- {question_id: reward_value}
  per_task_type_rewards JSONB DEFAULT '{}', -- {task_type: reward_value}
  total_budget DECIMAL(12,2),
  payout_per_1000_responses DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- Campaign quality rules table
CREATE TABLE IF NOT EXISTS public.campaign_quality_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  validation_layers JSONB DEFAULT '{}', -- Multi-layer validation config
  geo_verification BOOLEAN DEFAULT FALSE,
  duplicate_detection BOOLEAN DEFAULT TRUE,
  ai_scoring_enabled BOOLEAN DEFAULT FALSE,
  disqualification_rules JSONB DEFAULT '{}',
  confidence_threshold DECIMAL(5,2) DEFAULT 70.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- In-house campaigns table (platform growth campaigns)
CREATE TABLE IF NOT EXISTS public.in_house_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type in_house_campaign_type NOT NULL,
  target_language TEXT, -- For translation campaigns
  status campaign_status DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for current_version_id
DO $$ BEGIN
  ALTER TABLE public.campaigns
    ADD CONSTRAINT fk_campaign_current_version
    FOREIGN KEY (current_version_id) REFERENCES public.campaign_versions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes for performance (IF NOT EXISTS for indexes)
CREATE INDEX IF NOT EXISTS idx_campaigns_company_name ON public.campaigns(company_name);
CREATE INDEX IF NOT EXISTS idx_campaigns_industry ON public.campaigns(industry);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_in_house ON public.campaigns(is_in_house);
CREATE INDEX IF NOT EXISTS idx_campaigns_approval_status ON public.campaigns(approval_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_wizard_step ON public.campaigns(wizard_step);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_campaign_id ON public.campaign_versions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_version_number ON public.campaign_versions(campaign_id, version_number);
CREATE INDEX IF NOT EXISTS idx_campaign_collaborators_campaign_id ON public.campaign_collaborators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_collaborators_user_id ON public.campaign_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_collaborators_last_active ON public.campaign_collaborators(last_active_at);
CREATE INDEX IF NOT EXISTS idx_campaign_approvals_campaign_id ON public.campaign_approvals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_approvals_status ON public.campaign_approvals(status);
CREATE INDEX IF NOT EXISTS idx_question_templates_sector ON public.question_templates(sector);
CREATE INDEX IF NOT EXISTS idx_question_templates_question_type ON public.question_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_question_templates_is_internal ON public.question_templates(is_internal);
CREATE INDEX IF NOT EXISTS idx_reward_configurations_campaign_id ON public.reward_configurations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_quality_rules_campaign_id ON public.campaign_quality_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_in_house_campaigns_type ON public.in_house_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_in_house_campaigns_status ON public.in_house_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_in_house_campaigns_campaign_id ON public.in_house_campaigns(campaign_id);

-- Triggers for updated_at (DROP IF EXISTS then CREATE to avoid conflicts)
DROP TRIGGER IF EXISTS update_campaign_approvals_updated_at ON public.campaign_approvals;
CREATE TRIGGER update_campaign_approvals_updated_at BEFORE UPDATE ON public.campaign_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_question_templates_updated_at ON public.question_templates;
CREATE TRIGGER update_question_templates_updated_at BEFORE UPDATE ON public.question_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reward_configurations_updated_at ON public.reward_configurations;
CREATE TRIGGER update_reward_configurations_updated_at BEFORE UPDATE ON public.reward_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_quality_rules_updated_at ON public.campaign_quality_rules;
CREATE TRIGGER update_campaign_quality_rules_updated_at BEFORE UPDATE ON public.campaign_quality_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_in_house_campaigns_updated_at ON public.in_house_campaigns;
CREATE TRIGGER update_in_house_campaigns_updated_at BEFORE UPDATE ON public.in_house_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all new tables
ALTER TABLE public.campaign_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_quality_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_house_campaigns ENABLE ROW LEVEL SECURITY;

-- Campaign versions policies (DROP IF EXISTS then CREATE)
DROP POLICY IF EXISTS "Clients can view versions of their campaigns" ON public.campaign_versions;
CREATE POLICY "Clients can view versions of their campaigns"
  ON public.campaign_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_versions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can view all campaign versions" ON public.campaign_versions;
CREATE POLICY "Admins can view all campaign versions"
  ON public.campaign_versions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Clients can create versions of their campaigns" ON public.campaign_versions;
CREATE POLICY "Clients can create versions of their campaigns"
  ON public.campaign_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_versions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can create versions for all campaigns" ON public.campaign_versions;
CREATE POLICY "Admins can create versions for all campaigns"
  ON public.campaign_versions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Campaign collaborators policies
DROP POLICY IF EXISTS "Users can view collaborators of campaigns they're part of" ON public.campaign_collaborators;
CREATE POLICY "Users can view collaborators of campaigns they're part of"
  ON public.campaign_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_collaborators.campaign_id
      AND (campaigns.client_id = auth.uid() OR campaigns.internal_owner_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Campaign owners can manage collaborators" ON public.campaign_collaborators;
CREATE POLICY "Campaign owners can manage collaborators"
  ON public.campaign_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_collaborators.campaign_id
      AND (campaigns.client_id = auth.uid() OR campaigns.internal_owner_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Campaign approvals policies
DROP POLICY IF EXISTS "Clients can view approvals of their campaigns" ON public.campaign_approvals;
CREATE POLICY "Clients can view approvals of their campaigns"
  ON public.campaign_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_approvals.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can view all campaign approvals" ON public.campaign_approvals;
CREATE POLICY "Admins can view all campaign approvals"
  ON public.campaign_approvals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage campaign approvals" ON public.campaign_approvals;
CREATE POLICY "Admins can manage campaign approvals"
  ON public.campaign_approvals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Clients can update approvals of their campaigns" ON public.campaign_approvals;
CREATE POLICY "Clients can update approvals of their campaigns"
  ON public.campaign_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_approvals.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

-- Question templates policies
DROP POLICY IF EXISTS "All authenticated users can view question templates" ON public.question_templates;
CREATE POLICY "All authenticated users can view question templates"
  ON public.question_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage question templates" ON public.question_templates;
CREATE POLICY "Admins can manage question templates"
  ON public.question_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Reward configurations policies
DROP POLICY IF EXISTS "Clients can view reward configs of their campaigns" ON public.reward_configurations;
CREATE POLICY "Clients can view reward configs of their campaigns"
  ON public.reward_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = reward_configurations.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can view all reward configs" ON public.reward_configurations;
CREATE POLICY "Admins can view all reward configs"
  ON public.reward_configurations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Clients can manage reward configs of their campaigns" ON public.reward_configurations;
CREATE POLICY "Clients can manage reward configs of their campaigns"
  ON public.reward_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = reward_configurations.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all reward configs" ON public.reward_configurations;
CREATE POLICY "Admins can manage all reward configs"
  ON public.reward_configurations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Campaign quality rules policies
DROP POLICY IF EXISTS "Clients can view quality rules of their campaigns" ON public.campaign_quality_rules;
CREATE POLICY "Clients can view quality rules of their campaigns"
  ON public.campaign_quality_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_quality_rules.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can view all quality rules" ON public.campaign_quality_rules;
CREATE POLICY "Admins can view all quality rules"
  ON public.campaign_quality_rules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Clients can manage quality rules of their campaigns" ON public.campaign_quality_rules;
CREATE POLICY "Clients can manage quality rules of their campaigns"
  ON public.campaign_quality_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_quality_rules.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'company')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all quality rules" ON public.campaign_quality_rules;
CREATE POLICY "Admins can manage all quality rules"
  ON public.campaign_quality_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- In-house campaigns policies
DROP POLICY IF EXISTS "Admins can view all in-house campaigns" ON public.in_house_campaigns;
CREATE POLICY "Admins can view all in-house campaigns"
  ON public.in_house_campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage in-house campaigns" ON public.in_house_campaigns;
CREATE POLICY "Admins can manage in-house campaigns"
  ON public.in_house_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Update existing campaigns policies to include new fields
-- (These are already covered by existing policies, but we ensure they work with new columns)

