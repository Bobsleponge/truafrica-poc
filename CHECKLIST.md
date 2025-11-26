# TruAfrica POC - Setup and Testing Checklist

Use this checklist to track your progress through setup and testing.

## Phase 1: Supabase Project Setup

- [ ] Created Supabase account
- [ ] Created new project (name: truafrica-poc)
- [ ] Selected appropriate region
- [ ] Project provisioning completed
- [ ] Copied Project URL from Settings > API
- [ ] Copied anon public key from Settings > API
- [ ] Ran migration `001_initial_schema.sql` in SQL Editor
- [ ] Verified all 7 tables created (check Table Editor)
- [ ] Ran migration `002_seed_data.sql` in SQL Editor
- [ ] Verified 10 expertise fields exist
- [ ] Configured Authentication settings
- [ ] Added localhost:3000 to redirect URLs
- [ ] (Optional) Enabled OAuth providers
- [ ] Verified RLS policies are enabled

## Phase 2: Local Environment Configuration

- [ ] Installed dependencies (`npm install`)
- [ ] Copied `.env.example` to `.env.local`
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Ran `npm run setup:check` - all checks passed
- [ ] Ran `npm run setup:test-db` - connection successful
- [ ] Started dev server (`npm run dev`)
- [ ] Verified landing page loads at http://localhost:3000

## Phase 3: Testing Workflows

### Contributor Flow

- [ ] Signed up as contributor
- [ ] Verified redirect to onboarding
- [ ] Completed onboarding test
- [ ] Verified trust score calculated
- [ ] Verified redirect to dashboard
- [ ] Viewed contributor dashboard
- [ ] Verified stats display correctly
- [ ] (If questions exist) Answered a question
- [ ] Verified answer saved
- [ ] Verified consensus calculated
- [ ] Verified trust score updated
- [ ] Verified reward allocated (if correct)

### Company Flow

- [ ] Signed up as company
- [ ] Verified redirect to company dashboard
- [ ] Viewed company dashboard
- [ ] Verified stats show zeros initially
- [ ] Uploaded first question
- [ ] Verified question saved
- [ ] Uploaded 2 more questions (different fields/difficulties)
- [ ] Verified all questions appear in dashboard
- [ ] (After contributors answer) Viewed answers
- [ ] Verified consensus scores calculated
- [ ] Verified charts update
- [ ] Tested filters (by field)
- [ ] Tested filters (by difficulty)

### Integration Testing

- [ ] Created question as company
- [ ] Had 3+ contributors answer same question
- [ ] Verified consensus calculation works
- [ ] Verified similar answers get high consensus
- [ ] Verified different answers get low consensus
- [ ] Tracked trust score changes
- [ ] Verified trust score increases for correct answers
- [ ] Verified trust score decreases for incorrect answers
- [ ] Verified rewards allocated for correct answers
- [ ] Tested difficulty level access (trust score 50 = easy only)
- [ ] Tested difficulty level access (trust score 65 = easy + medium)
- [ ] Tested difficulty level access (trust score 85 = all levels)

### Edge Cases

- [ ] Tested accessing protected route without login (redirects to login)
- [ ] Tested submitting empty answer (validation error)
- [ ] Tested creating question without required fields (validation error)
- [ ] Tested answering same question twice (UNIQUE constraint)
- [ ] Tested mobile responsiveness
- [ ] Tested on different browsers

## Phase 4: Reward API Integration (Optional)

- [ ] Researched airtime provider APIs
- [ ] Researched mobile money provider APIs
- [ ] Researched grocery voucher provider APIs
- [ ] Signed up for provider developer accounts
- [ ] Obtained API credentials
- [ ] Tested APIs in sandbox
- [ ] Implemented provider in `rewardService.ts`
- [ ] Updated `getRewardProvider()` function
- [ ] Added environment variables for API keys
- [ ] Implemented webhook handlers
- [ ] Tested end-to-end reward redemption
- [ ] Verified transaction tracking

## Phase 5: Production Readiness

- [ ] Reviewed all RLS policies
- [ ] Verified no sensitive data exposed
- [ ] Checked API route authentication
- [ ] Reviewed environment variable usage
- [ ] Optimized database queries
- [ ] Added indexes where needed
- [ ] Tested production build (`npm run build`)
- [ ] Verified build succeeds without errors
- [ ] Set up production Supabase project
- [ ] Configured production environment variables
- [ ] (Optional) Set up CI/CD pipeline
- [ ] (Optional) Set up error tracking (Sentry)
- [ ] (Optional) Set up analytics

## Phase 6: Documentation

- [ ] Read README.md
- [ ] Read SETUP.md
- [ ] Read TESTING.md
- [ ] Read DEPLOYMENT.md (if deploying)
- [ ] Read REWARD_API_INTEGRATION.md (if integrating APIs)
- [ ] Reviewed code comments
- [ ] (Optional) Created user guides
- [ ] (Optional) Created video tutorials

## Final Verification

- [ ] All critical paths tested
- [ ] No blocking errors
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation complete
- [ ] Ready for next steps (deployment or further development)

---

**Notes:**
- Check off items as you complete them
- Use this checklist to track progress
- Refer to detailed guides (SETUP.md, TESTING.md) for step-by-step instructions

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

