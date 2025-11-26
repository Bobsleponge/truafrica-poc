-- Migration 005: Admin Global Configuration
-- Adds global configuration tables for pricing, rewards, complexity, cost of living, and task types
-- These tables allow admins to configure system-wide settings that affect all campaigns

-- Global reward rules table
CREATE TABLE IF NOT EXISTS public.global_reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_type question_type NOT NULL,
  base_reward_per_question DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  task_type_multipliers JSONB DEFAULT '{}', -- {audio: 1.5, video: 2.0, image: 1.3, text: 1.0}
  country_multipliers JSONB DEFAULT '{}', -- {country_code: multiplier}
  min_reward DECIMAL(10,2) DEFAULT 0.50,
  max_reward DECIMAL(10,2) DEFAULT 100.00,
  currency currency_type NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_type, currency)
);

-- Cost of living multipliers table
CREATE TABLE IF NOT EXISTS public.cost_of_living_multipliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 or alpha-3
  country_name TEXT NOT NULL,
  currency currency_type NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL DEFAULT 1.0000, -- Relative to base (ZAR = 1.0)
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, currency)
);

-- Complexity configurations table
CREATE TABLE IF NOT EXISTS public.complexity_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  difficulty_level difficulty_level NOT NULL,
  multiplier_value DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  default_assignment_rules JSONB DEFAULT '{}', -- Rules for auto-assigning complexity
  ai_assistance_threshold DECIMAL(5,2), -- Threshold for triggering AI assistance
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(difficulty_level)
);

-- Task type configurations table
CREATE TABLE IF NOT EXISTS public.task_type_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL, -- audio, video, image_classification, text, etc.
  base_reward_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  base_cost_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  estimated_time_seconds INTEGER, -- Average time to complete
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_type)
);

-- Global quality configuration table
CREATE TABLE IF NOT EXISTS public.global_quality_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  minimum_quality_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  duplicate_detection_level TEXT NOT NULL DEFAULT 'standard', -- strict, standard, lenient
  geo_verification_enabled BOOLEAN DEFAULT TRUE,
  geo_verification_strictness TEXT NOT NULL DEFAULT 'standard', -- strict, standard, lenient
  ai_validation_strictness TEXT NOT NULL DEFAULT 'standard', -- strict, standard, lenient
  ai_confidence_threshold DECIMAL(5,2) DEFAULT 0.80,
  human_review_threshold DECIMAL(5,2) DEFAULT 0.60, -- Below this, require human review
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Language configuration table
CREATE TABLE IF NOT EXISTS public.language_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_code TEXT NOT NULL, -- ISO 639-1 or 639-2
  language_name TEXT NOT NULL,
  native_name TEXT,
  is_supported BOOLEAN DEFAULT TRUE,
  is_rtl BOOLEAN DEFAULT FALSE, -- Right-to-left
  default_currency currency_type,
  cost_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Language-specific cost adjustment
  reward_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Language-specific reward adjustment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_reward_rules_question_type ON public.global_reward_rules(question_type);
CREATE INDEX IF NOT EXISTS idx_global_reward_rules_active ON public.global_reward_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_cost_of_living_country ON public.cost_of_living_multipliers(country_code);
CREATE INDEX IF NOT EXISTS idx_cost_of_living_currency ON public.cost_of_living_multipliers(currency);
CREATE INDEX IF NOT EXISTS idx_complexity_difficulty ON public.complexity_configurations(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_task_type_active ON public.task_type_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_language_code ON public.language_configurations(language_code);
CREATE INDEX IF NOT EXISTS idx_language_supported ON public.language_configurations(is_supported);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_global_reward_rules_updated_at
  BEFORE UPDATE ON public.global_reward_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complexity_configurations_updated_at
  BEFORE UPDATE ON public.complexity_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_type_configurations_updated_at
  BEFORE UPDATE ON public.task_type_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_quality_config_updated_at
  BEFORE UPDATE ON public.global_quality_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_configurations_updated_at
  BEFORE UPDATE ON public.language_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.global_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_of_living_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complexity_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_type_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_quality_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view and manage global config
-- Global reward rules
DROP POLICY IF EXISTS "Admins can view global reward rules" ON public.global_reward_rules;
CREATE POLICY "Admins can view global reward rules"
  ON public.global_reward_rules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage global reward rules" ON public.global_reward_rules;
CREATE POLICY "Admins can manage global reward rules"
  ON public.global_reward_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Cost of living multipliers
DROP POLICY IF EXISTS "Admins can view cost of living multipliers" ON public.cost_of_living_multipliers;
CREATE POLICY "Admins can view cost of living multipliers"
  ON public.cost_of_living_multipliers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage cost of living multipliers" ON public.cost_of_living_multipliers;
CREATE POLICY "Admins can manage cost of living multipliers"
  ON public.cost_of_living_multipliers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Complexity configurations
DROP POLICY IF EXISTS "Admins can view complexity configurations" ON public.complexity_configurations;
CREATE POLICY "Admins can view complexity configurations"
  ON public.complexity_configurations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage complexity configurations" ON public.complexity_configurations;
CREATE POLICY "Admins can manage complexity configurations"
  ON public.complexity_configurations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Task type configurations
DROP POLICY IF EXISTS "Admins can view task type configurations" ON public.task_type_configurations;
CREATE POLICY "Admins can view task type configurations"
  ON public.task_type_configurations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage task type configurations" ON public.task_type_configurations;
CREATE POLICY "Admins can manage task type configurations"
  ON public.task_type_configurations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Global quality config
DROP POLICY IF EXISTS "Admins can view global quality config" ON public.global_quality_config;
CREATE POLICY "Admins can view global quality config"
  ON public.global_quality_config FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage global quality config" ON public.global_quality_config;
CREATE POLICY "Admins can manage global quality config"
  ON public.global_quality_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Language configurations
DROP POLICY IF EXISTS "Admins can view language configurations" ON public.language_configurations;
CREATE POLICY "Admins can view language configurations"
  ON public.language_configurations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage language configurations" ON public.language_configurations;
CREATE POLICY "Admins can manage language configurations"
  ON public.language_configurations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Seed initial data for complexity configurations
INSERT INTO public.complexity_configurations (difficulty_level, multiplier_value, description, is_active)
VALUES
  ('easy', 1.0, 'Standard complexity - straightforward questions', TRUE),
  ('medium', 1.3, 'Moderate complexity - requires some thought', TRUE),
  ('hard', 1.6, 'High complexity - requires significant effort', TRUE)
ON CONFLICT (difficulty_level) DO NOTHING;

-- Seed initial data for task type configurations
INSERT INTO public.task_type_configurations (task_type, base_reward_multiplier, base_cost_multiplier, estimated_time_seconds, description, is_active)
VALUES
  ('audio', 1.5, 1.3, 120, 'Audio recording tasks', TRUE),
  ('video', 2.0, 1.8, 180, 'Video recording tasks', TRUE),
  ('image_classification', 1.3, 1.2, 30, 'Image classification tasks', TRUE),
  ('text', 1.0, 1.0, 60, 'Text-based tasks', TRUE),
  ('short_text', 0.9, 0.9, 30, 'Short text responses', TRUE),
  ('long_text', 1.2, 1.1, 120, 'Long form text responses', TRUE),
  ('multiple_choice', 0.8, 0.8, 20, 'Multiple choice questions', TRUE),
  ('single_choice', 0.7, 0.7, 15, 'Single choice questions', TRUE),
  ('rating', 0.6, 0.6, 10, 'Rating scale questions', TRUE),
  ('rating_scale', 0.7, 0.7, 15, 'Rating scale questions', TRUE),
  ('comparison', 1.1, 1.0, 45, 'Comparison tasks', TRUE),
  ('open_text', 1.0, 1.0, 60, 'Open-ended text questions', TRUE)
ON CONFLICT (task_type) DO NOTHING;

-- Seed initial cost of living multipliers (relative to ZAR = 1.0)
INSERT INTO public.cost_of_living_multipliers (country_code, country_name, currency, multiplier, notes)
VALUES
  ('ZA', 'South Africa', 'ZAR', 1.0000, 'Base reference point'),
  ('KE', 'Kenya', 'KES', 0.1500, 'Approximately 15% of ZAR cost of living'),
  ('NG', 'Nigeria', 'NGN', 0.0500, 'Approximately 5% of ZAR cost of living'),
  ('GH', 'Ghana', 'USD', 0.1200, 'Approximately 12% of ZAR cost of living'),
  ('TZ', 'Tanzania', 'USD', 0.1400, 'Approximately 14% of ZAR cost of living'),
  ('UG', 'Uganda', 'USD', 0.1300, 'Approximately 13% of ZAR cost of living'),
  ('US', 'United States', 'USD', 0.0550, 'For international clients')
ON CONFLICT (country_code, currency) DO NOTHING;

-- Seed initial global quality config
INSERT INTO public.global_quality_config (
  minimum_quality_score,
  duplicate_detection_level,
  geo_verification_enabled,
  geo_verification_strictness,
  ai_validation_strictness,
  ai_confidence_threshold,
  human_review_threshold
)
VALUES (
  70.00,
  'standard',
  TRUE,
  'standard',
  'standard',
  0.80,
  0.60
)
ON CONFLICT DO NOTHING;

-- Seed initial language configurations
INSERT INTO public.language_configurations (language_code, language_name, native_name, is_supported, is_rtl, default_currency, cost_multiplier, reward_multiplier)
VALUES
  ('en', 'English', 'English', TRUE, FALSE, 'USD', 1.00, 1.00),
  ('af', 'Afrikaans', 'Afrikaans', TRUE, FALSE, 'ZAR', 1.00, 1.00),
  ('zu', 'Zulu', 'isiZulu', TRUE, FALSE, 'ZAR', 1.00, 1.00),
  ('xh', 'Xhosa', 'isiXhosa', TRUE, FALSE, 'ZAR', 1.00, 1.00),
  ('sw', 'Swahili', 'Kiswahili', TRUE, FALSE, 'KES', 0.95, 0.95),
  ('ha', 'Hausa', 'Hausa', TRUE, FALSE, 'NGN', 0.90, 0.90),
  ('yo', 'Yoruba', 'Yorùbá', TRUE, FALSE, 'NGN', 0.90, 0.90),
  ('ig', 'Igbo', 'Igbo', TRUE, FALSE, 'NGN', 0.90, 0.90),
  ('ar', 'Arabic', 'العربية', TRUE, TRUE, 'USD', 1.10, 1.10)
ON CONFLICT (language_code) DO NOTHING;



