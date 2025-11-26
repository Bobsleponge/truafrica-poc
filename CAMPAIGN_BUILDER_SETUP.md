# Campaign Builder Setup Guide

This guide covers the setup and usage of the new 20-step Campaign Builder system.

## Prerequisites

1. **Database Migration**: Run migration 004 to add all new tables and fields
2. **Environment Variables**: Set up OpenAI API key for AI features
3. **Question Templates**: Seed initial question templates (optional)

## Setup Steps

### 1. Run Database Migration

```bash
npm run migrate
```

This will execute `004_campaign_builder_extensions.sql` which creates:
- Campaign versions table
- Campaign collaborators table
- Campaign approvals table
- Question templates table
- Reward configurations table
- Campaign quality rules table
- In-house campaigns table
- Extended fields on campaigns and questions tables

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

This enables AI features:
- Question optimization
- Scope recommendations
- Pricing suggestions
- Risk analysis
- Bias detection
- Compliance checks
- Summary generation

### 3. Seed Question Templates (Optional)

```bash
npm run seed:templates
```

This populates the question templates table with sector-specific templates for:
- Retail
- Healthcare
- Finance
- Agriculture
- Climate
- Translation (in-house)

## Usage

### Creating a New Campaign

1. Navigate to `/company/campaigns/builder`
2. Complete all 20 steps:
   - **Steps 1-3**: Client Information
   - **Steps 4-6**: Campaign Objectives
   - **Steps 7-9**: Target Audience
   - **Steps 10-13**: Question Building
   - **Steps 14-15**: Rewards & Incentives
   - **Steps 16-17**: Scale & Quality
   - **Step 18**: Pricing Calculator
   - **Steps 19-20**: Review & Approval

3. The wizard auto-saves on each step
4. Click "Complete Campaign" on step 20 to finalize

### Creating In-House Campaigns

1. Navigate to `/admin/in-house-campaigns/new`
2. Follow the same 20-step wizard
3. Campaigns are marked as `is_in_house = true`
4. Use for platform growth (translations, onboarding, feedback)

### Features

#### AI Integration
- **Question Optimization**: Get AI suggestions to improve questions
- **Scope Recommendations**: AI-powered campaign scope suggestions
- **Pricing Suggestions**: AI-recommended pricing based on campaign parameters
- **Risk Analysis**: Identify operational risks and mitigations
- **Bias Detection**: Detect potential bias in questions
- **Compliance Checks**: POPIA/GDPR compliance validation
- **Summary Generation**: Auto-generate campaign summaries

#### Real-Time Collaboration
- Multiple team members can edit campaigns simultaneously
- Presence tracking shows active collaborators
- Changes sync in real-time via Supabase Realtime

#### Version Control
- Automatic versioning on major changes
- Manual version creation
- Version comparison
- Restore previous versions

#### Approval Workflow
- Status transitions: draft → internal_review → client_review → approved → locked
- Approval history tracking
- Notes and comments

#### Export Options
- **PDF**: Professional campaign document (requires react-pdf)
- **Markdown**: Structured markdown format
- **JSON**: Full campaign data structure
- **Shareable Links**: Generate secure, time-limited share links

#### Reward Engine
- Automatic reward calculations
- African cost-of-living alignment
- Currency support (ZAR, KES, NGN, USD)
- Distribution methods (Airtime, Data Vouchers, Mobile Money, Cashback, Points)

#### Pricing Calculator
- Setup fees
- Per-response fees
- Reward budget
- QA & validation fees
- Analytics dashboard fees
- Fine-tuning & dataset packaging fees
- Margin calculations
- Discount suggestions

## API Endpoints

### Campaign Builder
- `POST /api/campaigns/builder` - Save wizard state
- `GET /api/campaigns/builder?campaignId=xxx` - Load wizard state

### Version Control
- `GET /api/campaigns/[id]/versions` - List versions
- `POST /api/campaigns/[id]/versions` - Create/restore version

### Collaboration
- `GET /api/campaigns/[id]/collaborate` - Get active collaborators
- `POST /api/campaigns/[id]/collaborate` - Update campaign (real-time)

### Approval
- `GET /api/campaigns/[id]/approve` - Get approval history
- `POST /api/campaigns/[id]/approve` - Update approval status

### Export
- `GET /api/campaigns/[id]/export?format=pdf|markdown|json|shareable` - Export campaign

### AI Services
- `POST /api/ai/optimize-questions` - Optimize questions
- `POST /api/ai/recommend-scope` - Recommend scope
- `POST /api/ai/suggest-pricing` - Suggest pricing
- `POST /api/ai/analyze-risks` - Analyze risks
- `POST /api/ai/detect-bias` - Detect bias
- `POST /api/ai/generate-summary` - Generate summary

### Rewards & Pricing
- `POST /api/rewards/calculate` - Calculate rewards
- `POST /api/pricing/calculate-full` - Full pricing calculation

### In-House Campaigns
- `GET /api/in-house-campaigns` - List in-house campaigns
- `POST /api/in-house-campaigns` - Create in-house campaign
- `PUT /api/in-house-campaigns` - Update in-house campaign

## Database Schema

### New Tables

**campaign_versions**
- Stores version history of campaigns
- Full campaign data snapshots
- Version notes

**campaign_collaborators**
- Tracks active collaborators
- Role-based access (owner/editor/viewer)
- Last active timestamp

**campaign_approvals**
- Approval workflow tracking
- Status transitions
- Reviewer notes

**question_templates**
- Sector-specific question templates
- Reusable question bank
- Internal/external templates

**reward_configurations**
- Campaign reward settings
- Currency and distribution method
- Per-question and per-task-type rewards

**campaign_quality_rules**
- Validation layer configuration
- Geo-verification settings
- Duplicate detection
- AI scoring settings

**in_house_campaigns**
- Platform growth campaigns
- Translation campaigns
- Onboarding campaigns
- Feedback campaigns

## Troubleshooting

### Migration Issues
If migration fails, check:
1. Previous migrations are applied
2. Database connection is working
3. User has proper permissions

### AI Features Not Working
1. Verify `OPENAI_API_KEY` is set
2. Check API key is valid
3. Ensure sufficient API credits

### Real-Time Collaboration Not Working
1. Verify Supabase Realtime is enabled
2. Check WebSocket connections
3. Verify RLS policies allow collaboration

## Next Steps

1. **PDF Export**: Install `@react-pdf/renderer` for full PDF support
2. **Email Notifications**: Add email notifications for approvals
3. **Advanced Analytics**: Build analytics dashboard
4. **Template Management UI**: Create UI for managing question templates

## Support

For issues or questions, check:
- Database migration logs
- API error responses
- Browser console for frontend errors
- Supabase logs for database issues



