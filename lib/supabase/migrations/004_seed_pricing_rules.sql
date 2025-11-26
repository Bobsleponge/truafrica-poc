-- Migration 004: Seed Default Pricing Rules
-- Inserts default pricing rules for all question types

-- Default pricing rules for each question type
-- Base prices and costs are in USD
-- Multipliers adjust based on complexity, urgency, and country

INSERT INTO public.pricing_rules (question_type, base_price_per_answer, base_cost_per_answer, multiplier_factors, is_active) VALUES
-- Open Text Questions
('open_text', 2.00, 1.20, 
 '{
   "complexity": {
     "easy": 1.0,
     "medium": 1.3,
     "hard": 1.6
   },
   "urgency": {
     "standard": 1.0,
     "express": 1.3
   },
   "country": {
     "default": 1.0,
     "South Africa": 1.1,
     "Nigeria": 1.0,
     "Kenya": 1.0
   }
 }'::jsonb,
 true),

-- Rating Questions
('rating', 1.50, 0.90,
 '{
   "complexity": {
     "easy": 1.0,
     "medium": 1.2,
     "hard": 1.4
   },
   "urgency": {
     "standard": 1.0,
     "express": 1.2
   },
   "country": {
     "default": 1.0,
     "South Africa": 1.1,
     "Nigeria": 1.0,
     "Kenya": 1.0
   }
 }'::jsonb,
 true),

-- Multiple Choice Questions
('multiple_choice', 1.50, 0.90,
 '{
   "complexity": {
     "easy": 1.0,
     "medium": 1.2,
     "hard": 1.4
   },
   "urgency": {
     "standard": 1.0,
     "express": 1.2
   },
   "country": {
     "default": 1.0,
     "South Africa": 1.1,
     "Nigeria": 1.0,
     "Kenya": 1.0
   }
 }'::jsonb,
 true),

-- Audio Questions
('audio', 3.00, 1.80,
 '{
   "complexity": {
     "easy": 1.0,
     "medium": 1.4,
     "hard": 1.8
   },
   "urgency": {
     "standard": 1.0,
     "express": 1.4
   },
   "country": {
     "default": 1.0,
     "South Africa": 1.1,
     "Nigeria": 1.0,
     "Kenya": 1.0
   }
 }'::jsonb,
 true)

ON CONFLICT (question_type) DO UPDATE
SET 
  base_price_per_answer = EXCLUDED.base_price_per_answer,
  base_cost_per_answer = EXCLUDED.base_cost_per_answer,
  multiplier_factors = EXCLUDED.multiplier_factors,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();




