-- Migration 010: Update RLS Policies
-- Updates all RLS policies to use new role structure
-- Implements role-based access control for: client_owner, client_user, team_account, contributor, platform_admin

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

-- Drop old company-related policies
DROP POLICY IF EXISTS "Companies can view their own questions" ON public.questions;
DROP POLICY IF EXISTS "Companies can create questions" ON public.questions;
DROP POLICY IF EXISTS "Companies can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Companies can view answers to their questions" ON public.answers;
DROP POLICY IF EXISTS "Companies can view their own stats" ON public.client_dashboard_stats;

-- Drop old admin policies that will be replaced
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can view all campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Admins can view all campaign questions" ON public.campaign_questions;
DROP POLICY IF EXISTS "Admins can manage all campaign questions" ON public.campaign_questions;
DROP POLICY IF EXISTS "Admins can view all pricing snapshots" ON public.campaign_pricing_snapshots;
DROP POLICY IF EXISTS "Admins can view all API usage" ON public.api_usage_events;
DROP POLICY IF EXISTS "Admins can view all validation events" ON public.validation_events;
DROP POLICY IF EXISTS "Admins can view all flagged answers" ON public.flagged_answers;
DROP POLICY IF EXISTS "Admins can update flagged answers" ON public.flagged_answers;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;

-- Drop old company policies from campaigns
DROP POLICY IF EXISTS "Clients can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Clients can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Clients can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Clients can view their own campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Clients can manage their own campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Clients can view their own campaign questions" ON public.campaign_questions;
DROP POLICY IF EXISTS "Clients can manage their own campaign questions" ON public.campaign_questions;
DROP POLICY IF EXISTS "Clients can view their own pricing snapshots" ON public.campaign_pricing_snapshots;
DROP POLICY IF EXISTS "Clients can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Clients can create their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Clients can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Clients can view their own API usage" ON public.api_usage_events;
DROP POLICY IF EXISTS "Clients can view validation events for their campaigns" ON public.validation_events;

-- ============================================================================
-- QUESTIONS TABLE POLICIES
-- ============================================================================

-- Contributors can view active questions (unchanged)
-- Policy already exists, keeping it

-- Client owners can view their own questions
CREATE POLICY "Client owners can view their own questions"
  ON public.questions FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users can view their client's questions
CREATE POLICY "Client users can view their client's questions"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u2.id = questions.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Team accounts can view all questions
CREATE POLICY "Team accounts can view all questions"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Client owners can create questions
CREATE POLICY "Client owners can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users (Manager sub-role) can create questions
CREATE POLICY "Client users (Manager) can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
      AND u2.id = questions.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Client owners can update their own questions
CREATE POLICY "Client owners can update their own questions"
  ON public.questions FOR UPDATE
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users (Manager sub-role) can update their client's questions
CREATE POLICY "Client users (Manager) can update their client's questions"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
      AND u2.id = questions.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- ============================================================================
-- ANSWERS TABLE POLICIES
-- ============================================================================

-- Contributors can view their own answers (unchanged)
-- Policy already exists

-- Client owners can view answers to their questions
CREATE POLICY "Client owners can view answers to their questions"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      WHERE questions.id = answers.question_id
      AND questions.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view answers to their client's questions
CREATE POLICY "Client users can view answers to their client's questions"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = q.client_id
      )
      WHERE q.id = answers.question_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all answers
CREATE POLICY "Team accounts can view all answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Contributors can create answers (unchanged)
-- Policy already exists

-- ============================================================================
-- CAMPAIGNS TABLE POLICIES
-- ============================================================================

-- Client owners can view their own campaigns
CREATE POLICY "Client owners can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users can view their client's campaigns
CREATE POLICY "Client users can view their client's campaigns"
  ON public.campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u2.id = campaigns.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Team accounts can view all campaigns
CREATE POLICY "Team accounts can view all campaigns"
  ON public.campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Client owners can create campaigns
CREATE POLICY "Client owners can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users (Manager sub-role) can create campaigns
CREATE POLICY "Client users (Manager) can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
      AND u2.id = campaigns.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Client owners can update their own campaigns
CREATE POLICY "Client owners can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users (Manager sub-role) can update their client's campaigns
CREATE POLICY "Client users (Manager) can update their client's campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
      AND u2.id = campaigns.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Team accounts can update campaigns (limited write)
CREATE POLICY "Team accounts can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- ============================================================================
-- CAMPAIGN BRIEFS POLICIES
-- ============================================================================

-- Client owners can view their own campaign briefs
CREATE POLICY "Client owners can view their own campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_briefs.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view their client's campaign briefs
CREATE POLICY "Client users can view their client's campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE c.id = campaign_briefs.campaign_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all campaign briefs
CREATE POLICY "Team accounts can view all campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Client owners can manage their own campaign briefs
CREATE POLICY "Client owners can manage their own campaign briefs"
  ON public.campaign_briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_briefs.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users (Manager) can manage their client's campaign briefs
CREATE POLICY "Client users (Manager) can manage their client's campaign briefs"
  ON public.campaign_briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE c.id = campaign_briefs.campaign_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
    )
  );

-- ============================================================================
-- CAMPAIGN QUESTIONS POLICIES
-- ============================================================================

-- Client owners can view their own campaign questions
CREATE POLICY "Client owners can view their own campaign questions"
  ON public.campaign_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_questions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view their client's campaign questions
CREATE POLICY "Client users can view their client's campaign questions"
  ON public.campaign_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE c.id = campaign_questions.campaign_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all campaign questions
CREATE POLICY "Team accounts can view all campaign questions"
  ON public.campaign_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Client owners can manage their own campaign questions
CREATE POLICY "Client owners can manage their own campaign questions"
  ON public.campaign_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_questions.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users (Manager) can manage their client's campaign questions
CREATE POLICY "Client users (Manager) can manage their client's campaign questions"
  ON public.campaign_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE c.id = campaign_questions.campaign_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
    )
  );

-- ============================================================================
-- CLIENT DASHBOARD STATS POLICIES
-- ============================================================================

-- Client owners can view their own stats
CREATE POLICY "Client owners can view their own stats"
  ON public.client_dashboard_stats FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users can view their client's stats
CREATE POLICY "Client users can view their client's stats"
  ON public.client_dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u2.id = client_dashboard_stats.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Team accounts can view all stats
CREATE POLICY "Team accounts can view all stats"
  ON public.client_dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- ============================================================================
-- API KEYS POLICIES
-- ============================================================================

-- Client owners can view their own API keys
CREATE POLICY "Client owners can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users can view their client's API keys
CREATE POLICY "Client users can view their client's API keys"
  ON public.api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u2.id = api_keys.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Client owners can create their own API keys
CREATE POLICY "Client owners can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- Client users (Manager) can create their client's API keys
CREATE POLICY "Client users (Manager) can create their client's API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.client_id = u2.client_id
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.sub_role = 'Manager'
      AND u2.id = api_keys.client_id
      AND (u2.role = 'client_owner' OR u2.role = 'client_user')
    )
  );

-- Client owners can update their own API keys
CREATE POLICY "Client owners can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'client_owner'
    )
  );

-- ============================================================================
-- API USAGE EVENTS POLICIES
-- ============================================================================

-- Client owners can view their own API usage
CREATE POLICY "Client owners can view their own API usage"
  ON public.api_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = api_usage_events.api_key_id
      AND api_keys.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view their client's API usage
CREATE POLICY "Client users can view their client's API usage"
  ON public.api_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys ak
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = ak.client_id
      )
      WHERE ak.id = api_usage_events.api_key_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all API usage
CREATE POLICY "Team accounts can view all API usage"
  ON public.api_usage_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- System can create API usage events (unchanged)
-- Policy already exists

-- ============================================================================
-- CAMPAIGN PRICING SNAPSHOTS POLICIES
-- ============================================================================

-- Client owners can view their own pricing snapshots
CREATE POLICY "Client owners can view their own pricing snapshots"
  ON public.campaign_pricing_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_pricing_snapshots.campaign_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view their client's pricing snapshots
CREATE POLICY "Client users can view their client's pricing snapshots"
  ON public.campaign_pricing_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE c.id = campaign_pricing_snapshots.campaign_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all pricing snapshots
CREATE POLICY "Team accounts can view all pricing snapshots"
  ON public.campaign_pricing_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- ============================================================================
-- VALIDATION EVENTS POLICIES
-- ============================================================================

-- Client owners can view validation events for their campaigns
CREATE POLICY "Client owners can view validation events for their campaigns"
  ON public.validation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers
      JOIN public.questions ON questions.id = answers.question_id
      JOIN public.campaign_questions ON campaign_questions.question_id = questions.id
      JOIN public.campaigns ON campaigns.id = campaign_questions.campaign_id
      WHERE answers.id = validation_events.answer_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view validation events for their client's campaigns
CREATE POLICY "Client users can view validation events for their client's campaigns"
  ON public.validation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers a
      JOIN public.questions q ON q.id = a.question_id
      JOIN public.campaign_questions cq ON cq.question_id = q.id
      JOIN public.campaigns c ON c.id = cq.campaign_id
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE a.id = validation_events.answer_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all validation events
CREATE POLICY "Team accounts can view all validation events"
  ON public.validation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- System can create validation events (unchanged)
-- Policy already exists

-- ============================================================================
-- FLAGGED ANSWERS POLICIES
-- ============================================================================

-- Client owners can view flagged answers for their campaigns
CREATE POLICY "Client owners can view flagged answers for their campaigns"
  ON public.flagged_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers
      JOIN public.questions ON questions.id = answers.question_id
      JOIN public.campaign_questions ON campaign_questions.question_id = questions.id
      JOIN public.campaigns ON campaigns.id = campaign_questions.campaign_id
      WHERE answers.id = flagged_answers.answer_id
      AND campaigns.client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'client_owner'
      )
    )
  );

-- Client users can view flagged answers for their client's campaigns
CREATE POLICY "Client users can view flagged answers for their client's campaigns"
  ON public.flagged_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.answers a
      JOIN public.questions q ON q.id = a.question_id
      JOIN public.campaign_questions cq ON cq.question_id = q.id
      JOIN public.campaigns c ON c.id = cq.campaign_id
      JOIN public.users u1 ON u1.client_id = (
        SELECT u2.client_id FROM public.users u2 WHERE u2.id = c.client_id
      )
      WHERE a.id = flagged_answers.answer_id
      AND u1.id = auth.uid()
      AND u1.role = 'client_user'
    )
  );

-- Team accounts can view all flagged answers
CREATE POLICY "Team accounts can view all flagged answers"
  ON public.flagged_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Team accounts can update flagged answers
CREATE POLICY "Team accounts can update flagged answers"
  ON public.flagged_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- System can create flagged answers (unchanged)
-- Policy already exists

-- ============================================================================
-- USERS TABLE POLICIES (Additional)
-- ============================================================================

-- Client owners can view users in their client organization
CREATE POLICY "Client owners can view users in their client"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_owner'
      AND u1.client_id = users.client_id
    )
  );

-- Client users can view users in their client organization
CREATE POLICY "Client users can view users in their client"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      WHERE u1.id = auth.uid()
      AND u1.role = 'client_user'
      AND u1.client_id = users.client_id
    )
  );

-- Team accounts can view all users
CREATE POLICY "Team accounts can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- ============================================================================
-- PRICING RULES POLICIES (Admin/Team only)
-- ============================================================================

-- Team accounts can view pricing rules
CREATE POLICY "Team accounts can view pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Team accounts can manage pricing rules
CREATE POLICY "Team accounts can manage pricing rules"
  ON public.pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Note: Platform admins use service-role, so no RLS policies needed for them



